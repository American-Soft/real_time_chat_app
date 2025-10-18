import { IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class DeleteNotificationDto {
    @ApiProperty({ description: 'ID of the notification to delete', example: 1 })
    @IsNumber()
    notificationId: number;
}