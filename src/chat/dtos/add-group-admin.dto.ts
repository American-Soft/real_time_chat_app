import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class AddGroupAdminDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the group',
  })
  @IsNumber()
  groupId: number;

  @ApiProperty({
    example: 42,
    description: 'ID of the user to make an admin',
  })
  @IsNumber()
  userId: number;
}
