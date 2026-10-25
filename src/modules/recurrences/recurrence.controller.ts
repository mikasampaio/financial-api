import { StartRecurrenceDto } from "./recurrence.dto";
import {
  Controller,
  Delete,
  Get,
  Param,
  UseGuards,
  Post,
  Body,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUserId } from "src/common/decorators/params.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";
import { RecurrenceService } from "./recurrence.service";
import { ObjectIdPipe } from "src/common/pipes/object-id.pipe";

@ApiTags("recurrences")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("recurrences")
export class RecurrenceController {
  constructor(private readonly service: RecurrenceService) {}
  @Post()
  @ApiOperation({
    summary: "Ativar recorrência a partir de transação existente",
  })
  start(@CurrentUserId() userId: string, @Body() data: StartRecurrenceDto) {
    return this.service.start(userId, data);
  }

  @Get()
  @ApiOperation({ summary: "Listar séries recorrentes do usuário" })
  list(@CurrentUserId() userId: string) {
    return this.service.list(userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Cancelar próximos lançamentos de uma série" })
  cancel(
    @Param("id", ObjectIdPipe) id: string,
    @CurrentUserId() userId: string,
  ) {
    return this.service.cancel(id, userId);
  }
}
