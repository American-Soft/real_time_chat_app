import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/app.module';
import serverlessExpress from '@vendia/serverless-express';

let server: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.enableCors({ origin: ['https://real-time-chat-app-seven-ochre.vercel.app'], credentials: true });
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export default async function handler(req: any, res: any) {
  server = server ?? (await bootstrap());
  return server(req, res);
}
