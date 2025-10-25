import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    example: 'Developers Group',
    description: 'Name of the group',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: [2, 3, 5],
    description: 'List of user IDs to be added as members',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  memberIds: number[];

  @ApiProperty({
    example: ["Group for discussing development topics"],
    description: 'Description of the group',
    type: [String],
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'https://example.com/group-image.png',
    description: 'URL of the group image',
  })
  @IsString()
  @IsOptional()
  imageUrl: string;

}

