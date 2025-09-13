import { ApiProperty } from "@nestjs/swagger";
import { IsArray, ArrayNotEmpty, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class MutualFriendsDto {
  @ApiProperty({
    example: [2, 3, 5],
    description: "List of other user IDs to check mutual friends with",
    isArray: true,
    type: Number,
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number) // ensures query body like ["2","3"] is cast to [2,3]
  @IsNumber({}, { each: true })
  otherUserIds: number[];
}
