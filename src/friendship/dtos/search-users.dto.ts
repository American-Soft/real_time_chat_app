import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class SearchUsersDto {
  @ApiPropertyOptional({
    example: "john",
    description: "Search keyword for username or email",
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Page number (default: 1)",
  })
  @IsOptional()
  @Type(() => Number) // ensures it's converted from query string
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: "Number of results per page (default: 10)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}
