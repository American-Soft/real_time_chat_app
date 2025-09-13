import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, MaxLength, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({
    example: 'John',
    description: 'The first name of the user',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100)
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the user',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100)
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user',
    maxLength: 250,
  })
  @IsEmail()
  @MaxLength(250)
  @IsNotEmpty()
  email: string;
  @ApiProperty({
    example: 'securePass123',
    description: 'The password for the user account (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
  @ApiPropertyOptional({
    example: 'john_doe',
    description: 'Optional username (2–150 characters)',
    minLength: 2,
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  username: string;
}