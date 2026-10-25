import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RecurrenceService } from "./recurrence.service";
import { RecurrenceController } from "./recurrence.controller";
@Module({
  imports: [PrismaModule],
  providers: [RecurrenceService],
  controllers: [RecurrenceController],
})
export class RecurrenceModule {}
