import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-cbc';
  private readonly ivLength = 16;
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>(
      'SECRET_KEY',
      'very_secret_key',
    );
  }

  async hashPassword(password: string): Promise<string> {
    if (!password) {
      this.logger.error('Password is empty');
      throw new BadRequestException('Password is empty');
    }
    try {
      return await argon2.hash(password);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Password encryption failed');
    }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      this.logger.error('Password or hash is empty');
      throw new BadRequestException('Password or hash is empty');
    }
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  generateTemporaryPassword(length = 12): string {
    if (length < 8) {
      throw new BadRequestException(
        'Password length must be at least 8 characters',
      );
    }
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const specialCharacters = '!@#$%^&*()_+<>?';
    const allCharacters = characters + specialCharacters;
    try {
      let result = '';
      for (let i = 0; i < length; i++) {
        result += allCharacters.charAt(
          Math.floor(Math.random() * allCharacters.length),
        );
      }
      return result;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Password generation failed');
    }
  }

  encryptString(text: string): string {
    if (!text) {
      throw new BadRequestException('Text is empty');
    }
    try {
      const key = crypto.createHash('sha256').update(this.secretKey).digest();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      let encrypted = cipher.update(text, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      return `${iv.toString('base64')}:${encrypted}`;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Encryption failed');
    }
  }

  decryptString(encryptedText: string): string {
    if (!encryptedText) {
      throw new BadRequestException('Encrypted text is empty');
    }
    try {
      const [ivBase64, encrypted] = encryptedText.split(':');
      if (!ivBase64 || !encrypted) {
        throw new BadRequestException('Invalid encrypted text format');
      }
      const iv = Buffer.from(ivBase64, 'base64');
      const key = crypto.createHash('sha256').update(this.secretKey).digest();
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Decryption failed');
    }
  }
}
