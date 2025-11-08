import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RtcRole, RtcTokenBuilder } from 'agora-token';

@Injectable()
export class AgoraService {
  private readonly appId: string;
  private readonly appCertificate: string;
  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.appId = this.configService.get<string>('AGORA_APP_ID');
    this.appCertificate = this.configService.get<string>('AGORA_APP_CERTIFICATE');

    if (!this.appId || !this.appCertificate) {
      throw new Error('Agora credentials are not configured');
    }
  }

  public generateRtcToken(
    channelName: string,
    uid: string | number,
    role: number = RtcRole.PUBLISHER,
    expireSeconds = 3600,
  ) {
    if (!channelName) throw new BadRequestException('Channel name is required.');
    if (!uid && uid !== 0) throw new BadRequestException('User ID or account is required.');
    if (expireSeconds < 60) throw new BadRequestException('Expiration must be at least 60 seconds.');

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const expirationTimestamp = currentTimestamp + expireSeconds;

    const buildArgs = [
      this.appId,
      this.appCertificate,
      channelName,
      uid,
      role,
      expirationTimestamp,
      expirationTimestamp,
    ] as const;

    const token =
      typeof uid === 'number'
        ? RtcTokenBuilder.buildTokenWithUid(...buildArgs)
        : RtcTokenBuilder.buildTokenWithUserAccount(...buildArgs);



    return {
      token,
      channelName,
      uid,
      role,
      expiresIn: expireSeconds,
      expireAt: expirationTimestamp,
    };
  }
}






