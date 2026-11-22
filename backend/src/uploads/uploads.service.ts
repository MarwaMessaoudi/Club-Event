import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Multer } from 'multer';

@Injectable()
export class UploadsService {
  private readonly uploadsDir: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(private readonly config: ConfigService) {
    this.uploadsDir = join(process.cwd(), 'uploads');
    this.maxFileSize = this.config.get<number>('UPLOAD_MAX_SIZE', 5 * 1024 * 1024); // 5MB default
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    // Create uploads directory if it doesn't exist
    if (!existsSync(this.uploadsDir)) {
      mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} not allowed. Allowed: ${this.allowedMimeTypes.join(', ')}`,
      );
    }
  }

  getUniqueFilename(originalName: string): string {
    const ext = originalName.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}.${ext}`;
  }

  getSubfolder(folder?: string): string {
    if (!folder) return '';

    const safeFolder = folder.replace(/[^a-zA-Z0-9-_]/g, '');
    const subfolderPath = join(this.uploadsDir, safeFolder);

    if (!existsSync(subfolderPath)) {
      mkdirSync(subfolderPath, { recursive: true });
    }

    return safeFolder;
  }

  getRelativeUrl(filename: string, folder?: string): string {
    const subfolder = this.getSubfolder(folder);
    return subfolder ? `/uploads/${subfolder}/${filename}` : `/uploads/${filename}`;
  }
}