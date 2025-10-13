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
      // Check if DATABASE_URL or MYSQL_URL is provided (Railway's connection string)
      const databaseUrl = configService.get<string>('DATABASE_URL') || configService.get<string>('MYSQL_URL');

      if (databaseUrl) {
        try {
          // Parse Railway's DATABASE_URL
          const url = new URL(databaseUrl);

          console.log('Database connection info:', {
            host: url.hostname,
            port: url.port || 3306,
            username: url.username,
            database: url.pathname.slice(1),
          });

          return {
            type: 'mysql' as const,
            host: url.hostname,
            port: parseInt(url.port) || 3306,
            username: url.username,
            password: decodeURIComponent(url.password),
            database: url.pathname.slice(1), // Remove leading '/'
            autoLoadEntities: true,
            synchronize: true,
            connectTimeout: 60000,
            acquireTimeout: 60000,
            timeout: 60000,
            ssl: {
              rejectUnauthorized: false
            },
            extra: {
              connectionLimit: 10,
            },
          };
        } catch (error) {
          console.error('Error parsing DATABASE_URL:', error);
          throw error;
        }
      }

      // Fallback to individual environment variables (local development)
      return {
        type: 'mysql' as const,
        host: configService.get<string>("DB_HOST") || 'localhost',
        port: configService.get<number>('DB_PORT') || 3306,
        username: configService.get<string>('DB_USERNAME') || 'root',
        password: configService.get<string>('DB_PASSWORD') || '',
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true,
        ssl: configService.get<string>('DB_SSL') === 'true' ? {
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
