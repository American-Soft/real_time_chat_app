import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber } from 'class-validator';

export class UnmuteNotificationsDto {
    @ApiProperty({ description: 'Unmute notifications for a chat room', example: 2, required: false })
    @IsNumber()
    @IsOptional()
    chatRoomId?: number;

    @ApiProperty({ description: 'Unmute notifications for a group', example: 5, required: false })
    @IsNumber()
    @IsOptional()
    groupId?: number;
}
