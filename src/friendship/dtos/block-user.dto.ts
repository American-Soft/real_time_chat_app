import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class BlockUserDto {
  @ApiProperty({ description: 'ID of the user to block', example: 2 })
  @IsInt()
  @Min(1)
  otherUserId: number;
}



