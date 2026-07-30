import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectS3 } from 'nestjs-s3';
import type { S3 } from 'nestjs-s3';
import sharp from 'sharp';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly bucketName: string;

  constructor(
    @InjectS3() private readonly s3: S3,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get<string>('S3_BUCKET')!;
  }

  async uploadBlogImage(
    buffer: Buffer,
    contentType: string,
    itemId: string,
  ): Promise<string> {
    const hash = createHash('sha256')
      .update(buffer)
      .digest('hex')
      .substring(0, 8);
    const webpBuffer = await this.compressToWebp(buffer);
    const key = `blogs/images/${itemId}-${hash}.webp`;
    await this.s3.putObject({
      Bucket: this.bucketName,
      Key: key,
      Body: webpBuffer,
      ContentType: 'image/webp',
    });

    this.logger.log(`Uploaded to s3://${this.bucketName}/${key}`);
    const imgUrl = `${this.configService.get<string>('CDN_URL')}/${key}`;
    return imgUrl;
  }

  async uploadImage(
    buffer: Buffer,
    contentType: string,
    itemId: string,
  ): Promise<string> {
    const webpBuffer = await this.compressToWebp(buffer);
    const key = `images/${itemId}.webp`;
    await this.s3.putObject({
      Bucket: this.bucketName,
      Key: key,
      Body: webpBuffer,
      ContentType: 'image/webp',
    });

    this.logger.log(`Uploaded to s3://${this.bucketName}/${key}`);
    const imgUrl = `${this.configService.get<string>('CDN_URL')}/${key}`;
    return imgUrl;
  }

  async deleteImage(imageUri: string): Promise<void> {
    const cdnUrl = this.configService.get<string>('CDN_URL')!;
    const key = imageUri.startsWith(cdnUrl)
      ? imageUri.substring(cdnUrl.length + 1)
      : imageUri;
    await this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: key,
    });
    this.logger.log(`Deleted s3://${this.bucketName}/${key}`);
  }

  private async compressToWebp(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer).webp({ quality: 80 }).toBuffer();
  }
}
