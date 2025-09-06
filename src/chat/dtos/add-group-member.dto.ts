import { IsArray, IsNumber } from "class-validator";

export class AddGroupMemberDto {
  @IsNumber({}, { each: true })
  userId: number;

  @IsNumber()
  groupId: number;
}