import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetMessagesDto {
  @Type (() => Number)

  @IsNumber()
  receiverId: number;

    @IsNumber()
  @IsOptional()
  groupId?: number;

  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  limit?: number = 20;
} 