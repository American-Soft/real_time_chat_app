import { BadRequestException, Global, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileUploadService } from './file-upload.service';

function ensureDirectory(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

@Global()
@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const isProfile = file.fieldname === 'profile-image';
          const isGroupImage = file.fieldname === 'group-image';
          let destinationPath = './uploads/chat';

          if (isProfile) {
            destinationPath = './profile-images';
          } else if (isGroupImage) {
            destinationPath = './uploads/groups';
          }

          ensureDirectory(destinationPath);
          cb(null, destinationPath);
        },
        filename: (req, file, cb) => {
          const isProfile = file.fieldname === 'profile-image';
          const isGroupImage = file.fieldname === 'group-image';

          if (isProfile) {
            const prefix = `${Date.now()}-${Math.round(Math.random() * 1000000)}`;
            const filename = `${prefix}-${file.originalname}`;
            cb(null, filename);
          } else if (isGroupImage) {
            const prefix = `${Date.now()}-${Math.round(Math.random() * 1000000)}`;
            const filename = `${prefix}-${file.originalname}`;
            cb(null, filename);
          } else {
            const uniqueName = uuidv4();
            const extension = extname(file.originalname);
            cb(null, `${uniqueName}${extension}`);
          }
        },
      }),
      fileFilter: (req, file, cb) => {
        const isProfile = file.fieldname === 'profile-image';
        const isGroupImage = file.fieldname === 'group-image';

        if (isProfile || isGroupImage) {
          if (file.mimetype.startsWith('image')) {
            cb(null, true);
          } else {
            cb(new BadRequestException('Unsupported file format'), false);
          }
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 1024 * 1024 },
    }),
  ],
  providers: [FileUploadService],
  exports: [MulterModule, FileUploadService],
})
export class UploadModule { }


