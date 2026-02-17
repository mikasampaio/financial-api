import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";

export class PaginationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit: number;
}
