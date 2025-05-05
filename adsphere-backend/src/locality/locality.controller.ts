import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { LocalityService } from './locality.service';

@Controller('localities')
export class LocalityController {
  constructor(private readonly localityService: LocalityService) {}

  @Get('/')
  async getByCounty(@Query('county') county: string) {
    if(!county) {
      throw new BadRequestException('County not found');
    }
    return {
      data: await this.localityService.getByCounty(county),
    };
  }

  @Get('/counties')
  async getCounties() {
    return {
      data: await this.localityService.getCounties(),
    }
  }

  @Get('/autocomplete')
  async getAutocomplete(@Query('query') query: string) {
    return {
      data: await this.localityService.getAutocomplete(query)
    }
  }

  @Get('/nearby')
  async getNearbyLocality(@Query('lat') lat: number,
                          @Query('lng') lng: number) {
    if (!lat|| !lng) {
      throw new BadRequestException('Latitude and longitude are required');
    }
    return {
      data: await this.localityService.getNearbyLocality(+lat, +lng),
    };
  }

  @Get('/nearby-localities')
  async getNearbyLocalities(@Query('lat') lat: number,
                            @Query('lng') lng: number,
                            @Query('maxDistance') maxDistance: number) {
    if (!lat || !lng || !maxDistance) {
      throw new BadRequestException('Latitude, longitude, maxDistance are required');
    }
    return {
      data: await this.localityService.getNearbyLocalities(+lat, +lng, +maxDistance),
    };
  }
}
