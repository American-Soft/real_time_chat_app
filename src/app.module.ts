import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { MailModule } from './mail/mail.module';
@Module({
  imports: [UserModule,
    MailModule,TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      type: 'mysql',
      host: configService.get<string>("DB_HOST"),
      port: configService.get<number>('DB_PORT'),
      username: configService.get<string>('DB_USERNAME'),
      password: configService.get<string>('DB_PASSWORD'),
      database: configService.get<string>('DB_DATABASE'),
      autoLoadEntities: true,
      synchronize: true,
    }),
  
  }),
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  }),
],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
