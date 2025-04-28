import { IsString } from 'class-validator';

export class GoogleAuthDto {
  providerId: string;
  email: string;
  name: string;
}
