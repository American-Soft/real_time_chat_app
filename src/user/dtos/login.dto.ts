import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
      @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    maxLength: 250,
  })
    @IsEmail()
    @MaxLength(250)
    @IsNotEmpty()
    email: string;
  @ApiProperty({
    example: 'strongPassword123',
    description: 'User password (min 6 characters)',
    minLength: 6,
  })
    @IsString()
    @MinLength(6)
    @IsNotEmpty()
    password: string;
}