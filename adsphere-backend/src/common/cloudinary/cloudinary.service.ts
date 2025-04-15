import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    })
  }

  uploadImage(file: Express.Multer.File): Promise<{ publicId?: string; secureUrl?: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'adsphere' },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            publicId: result?.public_id,
            secureUrl: result?.secure_url,
          });
        },
      );

      streamifier.createReadStream(file.buffer)
        .pipe(uploadStream);
    });
  }
}
