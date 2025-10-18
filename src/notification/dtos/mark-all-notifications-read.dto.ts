import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber } from 'class-validator';
import { NotificationType } from '../enums/notification-type';

export class MarkAllNotificationsReadDto {
    @ApiProperty({ description: 'Filter by notification type', enum: NotificationType, required: false })
    @IsOptional()
    @IsEnum(NotificationType)
    type?: NotificationType;

    @ApiProperty({ description: 'Mark notifications as read for a specific chat room', example: 3, required: false })
    @IsOptional()
    @IsNumber()
    chatRoomId?: number;
}
