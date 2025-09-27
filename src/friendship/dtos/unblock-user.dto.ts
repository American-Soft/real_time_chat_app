import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UnblockUserDto {
  @ApiProperty({ description: 'ID of the user to unblock', example: 2 })
  @IsInt()
  @Min(1)
  otherUserId: number;
}



