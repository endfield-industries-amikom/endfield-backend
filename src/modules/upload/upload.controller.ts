import {
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../../common/entities/item.entity';
import { ResponsesService } from 'src/utils/responses/responses.service';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@Controller()
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    private readonly responsesService: ResponsesService<any>,
    private readonly uploadService: UploadService,
  ) {}

  @Post('product/:id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Employee')
  @ApiBearerAuth('bearer')
  async uploadImage(@Param('id') id: string, @Req() req: any, @Res() res: any) {
    try {
      const item = await this.itemRepository.findOne({ where: { id } });
      if (!item) throw new NotFoundException('Item not found');

      const data = await req.file();
      if (!data) {
        return this.responsesService
          .code('badRequest')
          .message('No file uploaded')
          .sendResponse(res, null);
      }

      const buffer = await data.toBuffer();

      if (item.imageUri) {
        try {
          await this.uploadService.deleteImage(item.imageUri);
        } catch (err) {
          this.logger.warn(
            `Failed to delete old S3 object: ${(err as Error).message}`
          );
        }
      }

      const key = await this.uploadService.uploadImage(
        buffer,
        data.mimetype,
        id,
      );

      await this.itemRepository.update(id, { imageUri: key });
      this.logger.log(`Image uploaded for item ${id}: ${key}`);

      return this.responsesService
        .code('created')
        .message('Image uploaded successfully')
        .sendResponse(res, { imageUri: key });
    } catch (error) {
      this.logger.error(`Upload failed: ${(error as Error).message}`);
      if (error instanceof NotFoundException) {
        return this.responsesService
          .code('notFound')
          .message(error.message)
          .sendResponse(res, null);
      }
      return this.responsesService
        .code('internalServerError')
        .message('File upload failed')
        .sendResponse(res, null);
    }
  }

  @Get('image/:id')
  async getImage(@Param('id') id: string, @Res() res: any) {
    try {
      const item = await this.itemRepository.findOne({ where: { id } });
      if (!item || !item.imageUri)
        throw new NotFoundException('Image not found');

      const url = await this.uploadService.getPresignedUrl(item.imageUri);
      return res.redirect(302, url);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return this.responsesService
          .code('notFound')
          .message(error.message)
          .sendResponse(res, null);
      }
      this.logger.error(`Get image failed: ${(error as Error).message}`);
      return this.responsesService
        .code('internalServerError')
        .message('Failed to retrieve image')
        .sendResponse(res, null);
    }
  }
}
