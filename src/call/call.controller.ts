import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AgoraService } from './agora.service';
import { AuthGuard } from '../user/guards/auth.guard';
import { CurrentUser } from '../user/decorator/current-user.decorator';
import { User } from '../user/user.entity';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RtcRole } from 'agora-token';
import { RtcTokenQueryDto } from './dtos/rtc-token.dto';

@ApiTags('Calls')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('v1/calls')
export class CallController {
  constructor(private readonly agoraService: AgoraService) { }

  @Get('rtc-token')
  @ApiOperation({ summary: 'Get Agora RTC token for a call' })
  @ApiQuery({ name: 'channel', required: true })
  @ApiQuery({ name: 'role', required: false, enum: ['publisher', 'subscriber'] })
  @ApiQuery({ name: 'expire', required: false, description: 'Token expiration time in seconds (minimum 60)' })

  @ApiResponse({ status: 200, description: 'RTC token generated' })
  getRtcToken(
    @CurrentUser() user: User,
    @Query() query: RtcTokenQueryDto,
  ) {
    const rtcRole = query.role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
    const expireSeconds = query.expire ?? 3600;

    return this.agoraService.generateRtcToken(query.channel, user.id, rtcRole, expireSeconds);
  }
}






