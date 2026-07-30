import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectS3 } from 'nestjs-s3';
import type { S3 } from 'nestjs-s3';

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
    const ext = this.mimeToExt(contentType);
    const key = `blogs/images/${itemId}${ext}`;
    await this.s3.putObject({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
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
    const ext = this.mimeToExt(contentType);
    const key = `images/${itemId}${ext}`;
    await this.s3.putObject({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    this.logger.log(`Uploaded to s3://${this.bucketName}/${key}`);
    const imgUrl = `${this.configService.get<string>('CDN_URL')}/${key}`;
    return imgUrl;
  }

  async deleteImage(id: string): Promise<void> {
    const key = `images/${id}.jpg`;
    await this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: key,
    });
    this.logger.log(`Deleted s3://${this.bucketName}/${key}`);
  }


  private mimeToExt(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/bmp': '.bmp',
    };
    return map[mime] || '.jpg';
  }
}
