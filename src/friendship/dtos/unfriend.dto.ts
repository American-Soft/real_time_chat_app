import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UnfriendDto {
  @ApiProperty({ description: 'ID of the user to unfriend', example: 2 })
  @IsInt()
  @Min(1)
  otherUserId: number;
}


