import { IsNotEmpty, IsOptional, IsString, Length, MinLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUserDto {
      @ApiPropertyOptional({
    example: 'newSecurePass123',
    description: 'New password (min 6 characters)',
    minLength: 6,
  })
    @IsString()
    @MinLength(6)
    @IsNotEmpty()
    @IsOptional()
    password?: string;
  @ApiPropertyOptional({
    example: 'updated_username',
    description: 'New username (2–150 characters)',
    minLength: 2,
    maxLength: 150,
  })
    @IsString()
    @Length(2, 150)
    @IsOptional()
    username?: string;
}