import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { AuthProvider } from './auth.provider';
import { MailModule } from 'src/mail/mail.module';
import { UserEventsListener } from './events/user-events.listener';
import { EventEmitterModule } from '@nestjs/event-emitter';


@Module({
    imports: [TypeOrmModule.forFeature([User]), MailModule, EventEmitterModule.forRoot()],

    controllers: [UserController],
    providers: [UserService, AuthProvider, UserEventsListener],
    exports: [UserService],

})
export class UserModule { }
