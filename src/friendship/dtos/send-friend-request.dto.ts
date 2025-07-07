import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class SendFriendRequestDto {
    @ApiProperty({ example: 456, description: 'ID of the user to send a friend request to' })

    @IsInt({ message: 'receiverId must be an integer' })
  @Min(1, { message: 'receiverId must be greater than 0' })
  receiverId: number;
} 