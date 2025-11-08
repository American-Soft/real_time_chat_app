import { BadRequestException, Global, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileUploadService } from './file-upload.service';
import { UploadPaths } from './enums/upload-paths';


const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.js', '.php', '.jsp', '.asp',
  '.aspx', '.html', '.htm', '.py', '.rb', '.dll',
];

function ensureDirectory(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function getUploadPath(fieldname: string): string {
  switch (fieldname) {
    case 'profile-image': return UploadPaths.PROFILE;
    case 'group-image': return UploadPaths.GROUP;
    default: return UploadPaths.CHAT;
  }
}

function generateFilename(file: Express.Multer.File): string {
  const prefix = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
  const safeName = file.originalname.replace(/\s+/g, '_');
  return `${prefix}-${safeName}`;
}

@Global()
@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const destinationPath = getUploadPath(file.fieldname);
          ensureDirectory(destinationPath);
          cb(null, destinationPath);
        },
        filename: (req, file, cb) => {
          const extension = extname(file.originalname);
          const isProfileOrGroup = ['profile-image', 'group-image'].includes(file.fieldname);
          const filename = isProfileOrGroup
            ? generateFilename(file)
            : `${uuidv4()}${extension}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();

        if (DANGEROUS_EXTENSIONS.includes(ext)) {
          return cb(new BadRequestException(`File type not allowed: ${ext}`), false);
        }

        const isImageField = ['profile-image', 'group-image'].includes(file.fieldname);
        if (isImageField && !file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }

        cb(null, true);
      },
      limits: {
        fileSize: 1 * 1024 * 1024,
      },
    }),
  ],
  providers: [FileUploadService],
  exports: [MulterModule, FileUploadService],
})
export class UploadModule { }
