import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/current-user.decorator';

const ONE_MB = 1024 * 1024;

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  /** Import responsibilities from an uploaded tracker CSV (field name: `file`). */
  @Post('responsibilities')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: ONE_MB },
    }),
  )
  async importResponsibilities(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file uploaded.');
    }
    const name = (file.originalname ?? '').toLowerCase();
    const looksCsv =
      name.endsWith('.csv') ||
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/plain';
    if (!looksCsv) {
      throw new BadRequestException(
        'Please upload a .csv file. Export your tracker sheet to CSV first.',
      );
    }
    return this.importService.importResponsibilities(
      user.sub,
      file.buffer.toString('utf8'),
    );
  }

  /** Download a ready-to-fill CSV template with the supported columns. */
  @Get('responsibilities/template')
  downloadTemplate(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="plos-import-template.csv"',
    );
    res.send(this.importService.buildTemplate());
  }
}
