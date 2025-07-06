import { IsInt, Min } from 'class-validator';

export class SendFriendRequestDto {
    @IsInt({ message: 'receiverId must be an integer' })
  @Min(1, { message: 'receiverId must be greater than 0' })
  receiverId: number;
} 