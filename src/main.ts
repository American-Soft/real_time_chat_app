import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
app.enableCors({
  origin: '*',
});
    const swagger = new DocumentBuilder()
  .setTitle("Real time chat app")
  .setDescription("A real time chat app with NestJS and TypeORM")
  .addServer("http://localhost:3000")
  .setVersion("1.0")
  .addSecurity('bearer', { type: 'http', scheme: 'bearer' })
  .addBearerAuth()
  .build();
  const documentation = SwaggerModule.createDocument(app,  swagger);
  SwaggerModule.setup("swagger", app, documentation);
  await app.listen(3000);
}
bootstrap();
