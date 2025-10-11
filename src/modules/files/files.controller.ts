import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';

import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get(':id')
  async getFile(@Param('id') id: string, @Res() res: Response) {
    const fileRecord = await this.filesService.getFile(id);

    res.set({
      'Content-Type': fileRecord.mimeType,
      'Cache-Control': 'public, max-age=31536000',
      'Content-Length': fileRecord.size.toString(),
    });

    res.send(fileRecord.data);
  }
}
