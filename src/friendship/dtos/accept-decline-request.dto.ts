import { IsInt } from "class-validator";

export class AcceptDeclineRequestDto {
  @IsInt ()
  requestId: number;
} 