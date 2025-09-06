import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { AuthProvider } from './auth.provider';
import { MailModule } from 'src/mail/mail.module';
 

@Module({
    imports: [TypeOrmModule.forFeature([User]), MailModule],

    controllers: [UserController],
    providers: [UserService, AuthProvider],
    exports: [UserService],

})
export class UserModule { }
