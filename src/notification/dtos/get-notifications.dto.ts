import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { NotificationStatus } from '../enums/notification-status';
import { NotificationType } from '../enums/notification-type';

export class GetNotificationsDto {
    @ApiProperty({ description: 'Filter by notification status', enum: NotificationStatus, required: false })
    @IsOptional()
    @IsEnum(NotificationStatus)
    status?: NotificationStatus;

    @ApiProperty({ description: 'Filter by notification type', enum: NotificationType, required: false })
    @IsOptional()
    @IsEnum(NotificationType)
    type?: NotificationType;

    @ApiProperty({ description: 'Page number for pagination', example: 1, minimum: 1, required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiProperty({ description: 'Number of items per page', example: 20, minimum: 1, maximum: 100, required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiProperty({ description: 'Filter notifications by chat room ID', example: 5, required: false })
    @IsOptional()
    @IsNumber()
    chatRoomId?: number;
}





