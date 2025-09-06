import { BadRequestException, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { AuthProvider } from './auth.provider';
import { MailModule } from 'src/mail/mail.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Module({
    imports: [TypeOrmModule.forFeature([User]), MailModule,
    MulterModule.register({
        storage: diskStorage({
            destination: './profile-images',
            filename: (req, file, cb) => {
                const prefix = `${Date.now()}-${Math.round(Math.random() * 1000000)}`;
                const filename = `${prefix}-${file.originalname}`;
                cb(null, filename);
            }
        }),
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith("image")) {
                cb(null, true);
            } else {
                cb(new BadRequestException("Unsupported file format"), false);
            }
        },
        limits: { fileSize: 1024 * 1024 }
    })],

    controllers: [UserController],
    providers: [UserService, AuthProvider],
    exports: [UserService],

})
export class UserModule { }
