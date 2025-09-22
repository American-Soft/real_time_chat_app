import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    example: 'Developers Group',
    description: 'Name of the group',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: [2, 3, 5],
    description: 'List of user IDs to be added as members',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  memberIds: number[];

  @ApiProperty({
    example: ["Group for discussing development topics"],
    description: 'Description of the group',
    type: [String],
  })
  @IsString()
  description: string;
}
