import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class GetMessagesDto {
  @ApiProperty({
    example: 10,
    description: 'ID of the receiver (user)',
  })
  @Type(() => Number)
  @IsNumber()
  receiverId: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'ID of the group (if fetching group messages)',
  })
  @IsNumber()
  @IsOptional()
  groupId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (default: 1)',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of messages per page (default: 20)',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit: number = 20;
}
