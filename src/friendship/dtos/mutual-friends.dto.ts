import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export class MutualFriendsDto {
  @ApiProperty({
    example: 2,
    description: "The ID of the other user to check mutual friends with",
  })
  @IsNumber()
  @IsNotEmpty()
  otherUserId: number;
}
