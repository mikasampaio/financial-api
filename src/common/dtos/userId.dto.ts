import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UserIdFilterDto {
  @ApiPropertyOptional({
    description: "ID do usuário",
    example: "507f1f77bcf86cd799439012",
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
