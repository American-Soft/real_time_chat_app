import { IsString  } from "class-validator";

export class SearchUsersDto {
  @IsString ()
  query: string;
} 