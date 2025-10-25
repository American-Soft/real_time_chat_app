import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateGroupDto {
  @ApiProperty({
    example: 'Updated Developers Group',
    description: 'Updated name of the group',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'Updated group for discussing development topics',
    description: 'Updated description of the group',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'https://example.com/group-image.png',
    description: 'URL of the group image',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

