import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { MailModule } from './mail/mail.module';
import { FriendshipModule } from './friendship/friendship.module';
import { ChatModule } from './chat/chat.module';
import { UploadModule } from './upload/upload.module';
import { CallModule } from './call/call.module';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [UserModule,
    MailModule,
    FriendshipModule,
    ChatModule,
    UploadModule,
    CallModule,
    AuthModule,
    TypeOrmModule.forRootAsync({
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      // Check if DATABASE_URL is provided (Railway's connection string)
      const databaseUrl = configService.get<string>('DATABASE_URL');

      if (databaseUrl) {
        // Parse Railway's DATABASE_URL
        const url = new URL(databaseUrl);
        return {
          type: 'mysql' as const,
          host: url.hostname,
          port: parseInt(url.port) || 3306,
          username: url.username,
          password: url.password,
          database: url.pathname.slice(1), // Remove leading '/'
          autoLoadEntities: true,
          synchronize: true,
          ssl: {
            rejectUnauthorized: false
          },
          extra: {
            connectionLimit: 10,
          },
        };
      }

      // Fallback to individual environment variables (local development)
      return {
        type: 'mysql' as const,
        host: configService.get<string>("DB_HOST"),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true,
        ssl: process.env.DB_SSL === 'true' ? {
          rejectUnauthorized: false
        } : false,
        extra: {
          connectionLimit: 10,
        },
      };
    },

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
