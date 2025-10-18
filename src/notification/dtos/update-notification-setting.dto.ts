import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { MuteDuration } from '../enums/mute-duration';

export class UpdateNotificationSettingsDto {
    @ApiProperty({ description: 'Allow notifications', example: true, required: false })
    @IsOptional()
    allowNotifications?: boolean;

    @ApiProperty({ description: 'Allow sound for notifications', example: false, required: false })
    @IsOptional()
    allowSound?: boolean;

    @ApiProperty({ description: 'Allow vibration for notifications', example: true, required: false })
    @IsOptional()
    allowVibration?: boolean;

    @ApiProperty({ description: 'Mute duration for notifications', enum: MuteDuration, required: false })
    @IsEnum(MuteDuration)
    @IsOptional()
    muteDuration?: MuteDuration;

    @ApiProperty({ description: 'Apply settings to a specific chat room', example: 10, required: false })
    @IsNumber()
    @IsOptional()
    chatRoomId?: number;

    @ApiProperty({ description: 'Apply settings to a specific group', example: 4, required: false })
    @IsNumber()
    @IsOptional()
    groupId?: number;
}
