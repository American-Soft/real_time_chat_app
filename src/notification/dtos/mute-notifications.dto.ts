import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { MuteDuration } from '../enums/mute-duration';

export class MuteNotificationsDto {
    @ApiProperty({ description: 'Duration for muting notifications', enum: MuteDuration })
    @IsEnum(MuteDuration)
    duration: MuteDuration;

    @ApiProperty({ description: 'Mute notifications in a specific chat room', example: 2, required: false })
    @IsNumber()
    @IsOptional()
    chatRoomId?: number;

    @ApiProperty({ description: 'Mute notifications in a specific group', example: 7, required: false })
    @IsNumber()
    @IsOptional()
    groupId?: number;
}





