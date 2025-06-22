import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from './auth.provider';

@Module({
    imports: [TypeOrmModule.forFeature([User]),JwtModule.registerAsync({
      inject:[ConfigService],
      useFactory: async (configService: ConfigService) => ({
        global: true, 
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') }, // Token expiration time
      }),
    })], 

  controllers: [UserController],
  providers: [UserService,AuthProvider],
  exports: [UserService],

})
export class UserModule {}
