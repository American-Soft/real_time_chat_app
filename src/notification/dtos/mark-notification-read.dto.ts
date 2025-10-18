import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class MarkNotificationReadDto {
    @ApiProperty({ description: 'ID of the notification to mark as read', example: 12 })
    @IsNumber()
    @Type(() => Number)
    notificationId: number;
}
