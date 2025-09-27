import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class ExitGroupDto {
  @ApiProperty({ description: 'ID of the group to exit' })
  @IsInt()
  groupId: number;
}



