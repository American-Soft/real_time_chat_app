import { Inject, Injectable } from '@nestjs/common';
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
  ): { token: string; expireAt: number } {

    const currentTs = Math.floor(Date.now() / 1000);
    const expireAt = currentTs + expireSeconds;

     let token: string;

    if (typeof uid === 'number') {
      token = RtcTokenBuilder.buildTokenWithUid(
        this.appId,
        this.appCertificate,
        channelName,
        uid,
        role,
        expireAt,
        expireAt,
      );
    } else {
      token = RtcTokenBuilder.buildTokenWithUserAccount(
        this.appId,
        this.appCertificate,
        channelName,
        uid,
        role,
        expireAt,
        expireAt,
      );
    }

    return { token, expireAt };
  }
}






