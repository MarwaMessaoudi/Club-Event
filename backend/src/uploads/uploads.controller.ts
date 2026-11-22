import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UploadsService } from './uploads.service';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
uploadFile(
  @UploadedFile() file: Express.Multer.File,
  @Query('folder') folder?: string,
) {
  this.uploadsService.validateFile(file);

  const safeFolder = (folder || '').replace(/[^a-zA-Z0-9-_]/g, '');
  const url = safeFolder
    ? `/uploads/${safeFolder}/${file.filename}`
    : `/uploads/${file.filename}`;

  return { url, mimeType: file.mimetype, size: file.size, filename: file.filename };
}
}