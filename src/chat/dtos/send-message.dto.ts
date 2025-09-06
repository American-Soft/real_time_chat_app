import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { MessageType } from '../../enums/message-type.enum';

export class SendMessageDto {
  @IsNumber()
  receiverId: number;

  @IsEnum(MessageType)
  type: MessageType;

  @IsNumber()
  @IsOptional()
  groupId?: number;
  
  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @IsString()
  @IsOptional()
  mimeType?: string;
} 