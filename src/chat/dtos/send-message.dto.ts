import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsDate } from 'class-validator';
import { MessageType } from '../../enums/message-type.enum';
import { Type } from 'class-transformer';

export class SendMessageDto {
  @ApiProperty({
    example: 12,
    description: 'Receiver user ID',
  })
  @IsNumber()
  @Type(() => Number)
  receiverId: number;

  @ApiProperty({
    enum: MessageType,
    description: 'Type of the message (e.g., TEXT, IMAGE, FILE)',
  })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiPropertyOptional({
    example: 5,
    description: 'Group ID if the message is sent in a group',
  })
  @IsNumber()
  @IsOptional()
  groupId?: number;

  @ApiPropertyOptional({
    example: 'Hello, how are you?',
    description: 'Text content of the message',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/files/document.pdf',
    description: 'URL of the attached file',
  })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiPropertyOptional({
    example: 'document.pdf',
    description: 'Name of the file',
  })
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiPropertyOptional({
    example: 204800,
    description: 'Size of the file in bytes',
  })
  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @ApiPropertyOptional({
    example: 'application/pdf',
    description: 'MIME type of the file',
  })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiPropertyOptional({
    example: '2025-11-08T14:25:00Z',
    description: 'Optional custom message creation date',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAt?: Date;
}
