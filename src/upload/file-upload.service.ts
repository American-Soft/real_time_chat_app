import { Injectable } from '@nestjs/common';
import { MessageType } from '../enums/message-type.enum';

@Injectable()
export class FileUploadService {
  getFileUrl(filename: string): string {
    return `/uploads/chat/${filename}`;
  }

  getGroupImageUrl(filename: string): string {
    return `/uploads/groups/${filename}`;
  }

  getMessageTypeFromMimeType(mimeType: string): MessageType {
    if (mimeType === 'text/plain' || mimeType.startsWith('text/')) {
      return MessageType.TEXT;
    }
    return MessageType.FILE;
  }
}


