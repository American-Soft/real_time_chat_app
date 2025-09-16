import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class AddGroupMemberDto {
  @ApiProperty({
    example: 101,
    description: 'ID of the user to add to the group',
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    example: 5,
    description: 'ID of the group',
  })
  @IsNumber()
  groupId: number;
}
