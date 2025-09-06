import { IsNumber } from 'class-validator';

export class AddGroupAdminDto {
  @IsNumber()
  groupId: number;

  @IsNumber()
  userId: number;
}