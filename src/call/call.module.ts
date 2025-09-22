import { Module } from '@nestjs/common';
import { AgoraService } from './agora.service';
import { CallController } from './call.controller';

@Module({
  providers: [AgoraService],
  controllers: [CallController],
  exports: [AgoraService],
})
export class CallModule {}




