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
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '../../common/entities/item.entity';
import { ResponsesService } from 'src/utils/responses/responses.service';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Upload')
@Controller()
export class UploadController {
  private readonly logger = new Logger(UploadController.name);
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    private readonly responsesService: ResponsesService<any>,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = path.resolve(
      this.configService.get<string>('UPLOAD_DIR', './images'),
    );
  }

  @Post('product/:id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'Employee')
  @ApiBearerAuth('bearer')
  async uploadImage(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: any,
  ) {
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

      const mimeToExt: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/bmp': '.bmp',
      };
      const ext = mimeToExt[data.mimetype] || '.jpg';

      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
        this.logger.log(`Created upload directory: ${this.uploadDir}`);
      }

      if (item.imageUri) {
        if (fs.existsSync(this.uploadDir)) {
          const files = fs.readdirSync(this.uploadDir);
          for (const file of files) {
            if (file.startsWith(id)) {
              fs.unlinkSync(path.join(this.uploadDir, file));
              this.logger.log(`Deleted old image: ${file}`);
            }
          }
        }
      }

      const filename = `${id}${ext}`;
      const filePath = path.join(this.uploadDir, filename);
      const writeStream = fs.createWriteStream(filePath);
      await data.file.pipe(writeStream);
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      const imageUri = `/api/v1/image/${id}`;
      await this.itemRepository.update(id, { imageUri });
      this.logger.log(`Image uploaded for item ${id}: ${filename}`);

      return this.responsesService
        .code('created')
        .message('Image uploaded successfully')
        .sendResponse(res, { imageUri });
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
      if (!item || !item.imageUri) throw new NotFoundException('Image not found');
      if (!fs.existsSync(this.uploadDir)) throw new NotFoundException('Image not found');

      const files = fs.readdirSync(this.uploadDir);
      const imageFile = files.find((f) => f.startsWith(id));
      if (!imageFile) throw new NotFoundException('Image not found');

      const filePath = path.join(this.uploadDir, imageFile);
      const ext = path.extname(imageFile).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png', '.gif': 'image/gif',
        '.webp': 'image/webp', '.bmp': 'image/bmp',
      };
      const contentType = mimeTypes[ext] || 'image/jpeg';
      const stream = fs.createReadStream(filePath);
      res.header('Content-Type', contentType);
      res.header('Cache-Control', 'public, max-age=86400');
      return res.send(stream);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return this.responsesService.code('notFound').message(error.message).sendResponse(res, null);
      }
      return this.responsesService.code('internalServerError').message('Failed to retrieve image').sendResponse(res, null);
    }
  }
}
