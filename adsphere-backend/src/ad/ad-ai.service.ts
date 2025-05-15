import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AdAIService {
  private readonly API_URL: String;
  private readonly logger = new Logger(AdAIService.name);

  constructor(private readonly http: HttpService,
              private readonly configService: ConfigService) {
    this.API_URL = this.configService.get<string>('ADSPHERE_AI_SERVICE_URL') || '';
  }

  async enhanceAdTitle(title: string, description?: string) {
    const URL = `${this.API_URL}/enhance-ad/title`;
    this.logger.log(`[AI] Request to: ${URL}`);
    try {
      const response = await firstValueFrom(this.http.post(URL, { title, description }));
      this.logger.log(`[AI] Got response: ${JSON.stringify(response.data)}`);
      return response.data;  // Sau întregul obiect dacă vrei tot
    } catch (error) {
      this.logger.error(`[AI] Error from Python service`, error?.response?.data || error.message);
      throw error;
    }
  }

  async enhanceAdDescription(description: string, title?: string) {
    const URL = `${this.API_URL}/enhance-ad/description`;
    this.logger.log(`[AI] Request to: ${URL}`);
    return firstValueFrom(this.http.post(URL, { title, description }))
      .then(response => {
        this.logger.log(`[AI] Got response: ${JSON.stringify(response.data)}`);
        return response.data;  // Sau întregul obiect dacă vrei tot
      })
      .catch(error => {
        this.logger.error(`[AI] Error from Python service`, error?.response?.data || error.message);
        throw error;
      });

  }

  async getRecommendedAds(userId: string) {
    this.logger.log(`[AI] Getting recommended ads for user: ${userId}`);
    const URL = `${this.API_URL}/user-recommendations/${userId}`;
    this.logger.log(`[AI] Request to: ${URL}`);
    try {
      const response = await firstValueFrom(this.http.get(URL));
      // this.logger.log(`[AI] Got response: ${JSON.stringify(response.data)}`);
      return {
        data: response.data
      };
    } catch (error) {
      this.logger.error(`[AI] Error from Python service`, error?.response?.data || error.message);
      return {
        data: [],
      }
    }
  }

  async getRecommendedAdsForAd(userId: string, adId: string) {
    this.logger.log(`[AI] Getting recommended ads for user: ${userId} and ad: ${adId}`);
    const URL = `${this.API_URL}/user-recommendations/${adId}/user/${userId}`;
    this.logger.log(`[AI] Request to: ${URL}`);
    try {
      const response = await firstValueFrom(this.http.get(URL));
      this.logger.log(`[AI] Got response: ${JSON.stringify(response.data)}`);
      return response.data;  // Sau întregul obiect dacă vrei tot
    } catch (error) {
      this.logger.error(`[AI] Error from Python service`, error?.response?.data || error.message);
      return []
    }
  }
}
