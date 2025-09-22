import { IsIn, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RtcTokenQueryDto {
    @ApiProperty({
        example: 'myChannel123',
        description: 'The name of the Agora channel',
    })
    @IsString()
    channel: string;

    @ApiProperty({
        example: 'publisher',
        description: 'The role of the user in the channel',
        enum: ['publisher', 'subscriber'],
        required: false,
    })
    @IsOptional()
    @IsIn(['publisher', 'subscriber'])
    role?: 'publisher' | 'subscriber';


    @ApiProperty({
        example: 3600,
        description: 'Token expiration time in seconds (minimum 60)',
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(60)
    expire?: number;
}
