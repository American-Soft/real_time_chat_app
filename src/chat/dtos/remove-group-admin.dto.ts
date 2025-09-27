import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class RemoveGroupAdminDto {
  @ApiProperty({ description: 'ID of the group' })
  @IsInt()
  groupId: number;

  @ApiProperty({ description: 'ID of the admin user to remove' })
  @IsInt()
  userId: number;
}





