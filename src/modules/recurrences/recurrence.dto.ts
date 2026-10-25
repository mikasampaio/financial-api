import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  ValidateIf,
} from "class-validator";

export class StartRecurrenceDto {
  @ApiProperty({
    description: "Transação existente que servirá como primeiro lançamento",
  })
  @IsMongoId()
  transactionId: string;

  @ApiPropertyOptional({
    enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
    default: "MONTHLY",
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"])
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

  @ApiPropertyOptional({ description: "Data final inclusiva" })
  @IsOptional()
  @IsDateString({ strict: true })
  endsAt?: string;
}
