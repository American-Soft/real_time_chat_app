import { IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateGroupDto {
    @IsString()
    @IsNotEmpty()
    name: string;
    @IsArray()
    @IsNumber({}, { each: true })
    memberIds: number[];
}