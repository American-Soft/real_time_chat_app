import { ApiProperty } from "@nestjs/swagger";
import { IsString  } from "class-validator";

export class SearchUsersDto {
  @IsString ()
    @ApiProperty({ example: 'john', description: 'Search keyword for username or email' })
  @IsString()
  query: string;
} 