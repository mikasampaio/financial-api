import { StartRecurrenceDto } from "./recurrence.dto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { nextOccurrence, occurrenceId } from "./recurrence.helper";

@Injectable()
export class RecurrenceService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private readonly logger = new Logger(RecurrenceService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap() {
    if (this.config.get("RECURRENCE_WORKER_ENABLED") === "false") return;
    this.timer = setInterval(
      () =>
        void this.runDue().catch(() =>
          this.logger.error("Falha no processamento de recorrências"),
        ),
      60000,
    );
    this.timer.unref();
    void this.runDue().catch(() =>
      this.logger.error("Falha no processamento de recorrências"),
    );
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async start(userId: string, data: StartRecurrenceDto) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { id: data.transactionId, userId },
      });
      if (!transaction) throw new NotFoundException("Transação não encontrada");
      if (transaction.recurrenceId)
        throw new ConflictException("Transação já pertence a uma série");
      if (!transaction.categoryId)
        throw new BadRequestException(
          "Selecione uma categoria para a transação",
        );
      const category = await tx.category.findFirst({
        where: {
          id: transaction.categoryId,
          type: transaction.type,
          OR: [{ userId }, { userId: null }, { userId: { isSet: false } }],
        },
      });
      if (!category) throw new BadRequestException("Categoria não disponível");
      const frequency = data.frequency ?? "MONTHLY";
      const endsAt = data.endsAt
        ? new Date(
            data.endsAt.length === 10
              ? `${data.endsAt}T23:59:59.999Z`
              : data.endsAt,
          )
        : null;
      if (endsAt && endsAt < transaction.date)
        throw new BadRequestException("Data final anterior à transação");
      const nextDate = nextOccurrence(
        transaction.date,
        transaction.date,
        frequency,
      );
      const series = await tx.recurrence.create({
        data: {
          userId,
          categoryId: transaction.categoryId,
          amount: transaction.amount,
          description: transaction.description,
          type: transaction.type,
          startsAt: transaction.date,
          frequency,
          nextDate,
          endsAt,
          active: !endsAt || nextDate <= endsAt,
        },
      });
      const linked = await tx.transaction.updateMany({
        where: {
          id: transaction.id,
          userId,
          OR: [{ recurrenceId: null }, { recurrenceId: { isSet: false } }],
        },
        data: { recurrenceId: series.id, recurring: true },
      });
      if (!linked.count)
        throw new ConflictException(
          "Transação já vinculada durante a solicitação",
        );
      return series;
    });
  }

  list(userId: string) {
    return this.prisma.recurrence.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async cancel(id: string, userId: string) {
    const result = await this.prisma.recurrence.updateMany({
      where: { id, userId },
      data: { active: false },
    });
    if (!result.count)
      throw new NotFoundException("Recorrência não encontrada");
    return {
      message:
        "Recorrência cancelada. Lançamentos existentes foram preservados.",
    };
  }

  async runDue(now = new Date()) {
    if (this.running) return;
    this.running = true;
    try {
      // Limita cada execução, mas recupera períodos atrasados em execuções subsequentes.
      const due = await this.prisma.recurrence.findMany({
        where: { active: true, nextDate: { lte: now } },
        orderBy: { nextDate: "asc" },
        take: 100,
      });
      for (const series of due) {
        try {
          await this.prisma.$transaction(async (tx) => {
            const nextDate = nextOccurrence(
              series.nextDate,
              series.startsAt,
              series.frequency,
            );
            const expired = !!series.endsAt && series.nextDate > series.endsAt;
            // Compare-and-swap dentro da transação impede duplicação e disputa com cancelamento.
            const claimed = await tx.recurrence.updateMany({
              where: { id: series.id, active: true, nextDate: series.nextDate },
              data: {
                nextDate,
                active:
                  !expired && (!series.endsAt || nextDate <= series.endsAt),
              },
            });
            if (!claimed.count || expired) return;
            const category = await tx.category.findFirst({
              where: {
                id: series.categoryId,
                type: series.type,
                OR: [
                  { userId: series.userId },
                  { userId: null },
                  { userId: { isSet: false } },
                ],
              },
            });
            const user = await tx.user.findUnique({
              where: { id: series.userId },
              select: { id: true },
            });
            if (!category || !user) {
              await tx.recurrence.update({
                where: { id: series.id },
                data: { active: false },
              });
              return;
            }
            const id = occurrenceId(series.id, series.nextDate);
            await tx.transaction.upsert({
              where: { id },
              update: {},
              create: {
                id,
                recurrenceId: series.id,
                userId: series.userId,
                categoryId: series.categoryId,
                amount: series.amount,
                description: series.description,
                type: series.type,
                date: series.nextDate,
                recurring: true,
                status: { createdAt: now },
              },
            });
          });
        } catch {
          this.logger.error(
            `Falha ao processar recorrência ${series.id}; será tentada novamente`,
          );
        }
      }
    } finally {
      this.running = false;
    }
  }
}
