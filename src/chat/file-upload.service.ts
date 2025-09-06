import { Injectable, BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MessageType } from '../enums/message-type.enum';

@Injectable()
export class FileUploadService {
/*   // Configure multer for file uploads
  getMulterConfig() {
    return {
      storage: diskStorage({
        destination: './uploads/chat',
        filename: (req, file, cb) => {
          const uniqueName = uuidv4();
          const extension = extname(file.originalname);
          cb(null, `${uniqueName}${extension}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Check file type
          file.messageType = MessageType.FILE;
          cb(null, true);

      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
    };
  } */

  // Get file URL for frontend access
  getFileUrl(filename: string): string {
    return `/uploads/chat/${filename}`;
  }


  // Get message type from MIME type
getMessageTypeFromMimeType(mimeType: string): MessageType {
  if (mimeType === 'text/plain' || mimeType.startsWith('text/')) {
    return MessageType.TEXT;
  }
  return MessageType.FILE;
}

} 