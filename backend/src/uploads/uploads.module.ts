import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { existsSync, mkdirSync } from 'fs';

@Module({
  imports: [
    MulterModule.register({
  storage: diskStorage({
    destination: (req, file, cb) => {
      const raw = (req.query.folder as string) || '';
      const folder = raw.replace(/[^a-zA-Z0-9-_]/g, '');
      const uploadPath = folder
        ? join(process.cwd(), 'uploads', folder)
        : join(process.cwd(), 'uploads');

      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = file.originalname.split('.').pop()?.toLowerCase() || 'bin';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
    },
  }),
}),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}