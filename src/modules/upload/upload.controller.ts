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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/product.entity';
import { ResponsesService } from 'src/utils/responses/responses.service';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'products');

@ApiTags('Upload')
@Controller()
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly responsesService: ResponsesService<any>,
  ) {}

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
      const product = await this.productRepository.findOne({
        where: { id },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

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

      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }

      // Delete old image file if it exists
      if (product.imageUri) {
        if (fs.existsSync(UPLOAD_DIR)) {
          const files = fs.readdirSync(UPLOAD_DIR);
          for (const file of files) {
            if (file.startsWith(id)) {
              fs.unlinkSync(path.join(UPLOAD_DIR, file));
              this.logger.log(`Deleted old image: ${file}`);
            }
          }
        }
      }

      const filename = `${id}${ext}`;
      const filePath = path.join(UPLOAD_DIR, filename);
      const writeStream = fs.createWriteStream(filePath);
      await data.file.pipe(writeStream);

      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      const imageUri = `/api/v1/image/${id}`;
      await this.productRepository.update(id, { imageUri });

      this.logger.log(`Image uploaded for product ${id}: ${filename}`);

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
      const product = await this.productRepository.findOne({
        where: { id },
      });

      if (!product || !product.imageUri) {
        throw new NotFoundException('Image not found');
      }

      if (!fs.existsSync(UPLOAD_DIR)) {
        throw new NotFoundException('Image not found');
      }

      const files = fs.readdirSync(UPLOAD_DIR);
      const imageFile = files.find((f) => f.startsWith(id));

      if (!imageFile) {
        throw new NotFoundException('Image not found');
      }

      const filePath = path.join(UPLOAD_DIR, imageFile);
      const ext = path.extname(imageFile).toLowerCase();

      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
      };

      const contentType = mimeTypes[ext] || 'image/jpeg';
      const stream = fs.createReadStream(filePath);
      res.header('Content-Type', contentType);
      res.header('Cache-Control', 'public, max-age=86400');

      return res.send(stream);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return this.responsesService
          .code('notFound')
          .message(error.message)
          .sendResponse(res, null);
      }
      return this.responsesService
        .code('internalServerError')
        .message('Failed to retrieve image')
        .sendResponse(res, null);
    }
  }
}
