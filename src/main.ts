import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve /uploads (ephemeral on Railway/Vercel; for production use object storage)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // Allow only your frontends (replace with your domains)
  app.enableCors({
    origin: [
      'https://real-time-chat-app-seven-ochre.vercel.app',
      'https://your-custom-domain.com',
      'http://localhost:3000'
    ],
    credentials: true
  });

  const swagger = new DocumentBuilder()
    .setTitle('Real time chat app')
    .setDescription('A real time chat app with NestJS and TypeORM/Prisma')
    // List both prod and local servers so Swagger "Try it out" works
    .addServer('https://<your-railway-subdomain>.up.railway.app')
    .addServer('http://localhost:3000')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const doc = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('swagger', app, doc);

  // IMPORTANT: listen on the provided PORT and 0.0.0.0 for Railway
  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on http://0.0.0.0:${port}`);
}
bootstrap();
