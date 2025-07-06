import { IsInt } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AcceptDeclineRequestDto {
  @ApiProperty({ example: 123, description: 'ID of the friend request to accept or decline' })
  @IsInt()
  requestId: number;
} 