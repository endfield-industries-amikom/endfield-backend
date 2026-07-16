import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectS3 } from 'nestjs-s3';
import type { S3 } from 'nestjs-s3';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

  async uploadImage(
    buffer: Buffer,
    contentType: string,
    itemId: string,
  ): Promise<string> {
    const ext = this.mimeToExt(contentType);
    const key = `images/${itemId}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    this.logger.log(`Uploaded to s3://${this.bucketName}/${key}`);
    return key;
  }

  async deleteImage(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
    this.logger.log(`Deleted s3://${this.bucketName}/${key}`);
  }

  async getPresignedUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      return await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    } catch (error) {
      this.logger.error(`Failed to get presigned URL for ${key}`, error);
      throw error;
    }
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
