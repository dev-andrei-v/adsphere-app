import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  Query,
  UploadedFile,
  BadRequestException, UseInterceptors, Logger, Put,
} from '@nestjs/common';
import { AdService } from './ad.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdSearchService } from './ad-search.service';
import { AdAIService } from './ad-ai.service';
import { OptionalJwtAuthGuard } from '../auth/guard/optional-jwt-auth.guard';
import { HttpService } from '@nestjs/axios';

@Controller('ads')
export class AdController {
  private readonly logger = new Logger(AdController.name);

  constructor(private readonly adService: AdService,
              private readonly adAIService: AdAIService,
              private readonly adSearchService: AdSearchService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  publishAd(@Body() createAdDto: CreateAdDto,
         @CurrentUser() user: AuthUserDto) {
    return this.adService.createOrUpdateAd(createAdDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('recommended')
  async getRecommendedAds(
    @CurrentUser() user: AuthUserDto,
  ){
    return await this.adAIService.getRecommendedAds(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('recommended/:id')
  async getRecommendedAdsByAdId(
    @CurrentUser() user: AuthUserDto,
    @Param('id') adId: string
  ) {
    if (!isValidObjectId(adId)) {
      throw new BadRequestException('Invalid ad ID format');
    }
    this.logger.log(`Fetching recommended ads for ad ID: ${adId}`);
    return await this.adAIService.getRecommendedAdsForAd(user?.id, adId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('view/:adId')
  async getAdView(
    @CurrentUser() user: AuthUserDto,
    @Param('adId') adId: string
  ) {
    if (!isValidObjectId(adId)) {
      throw new BadRequestException('Invalid ad ID format');
    }
    this.logger.log(`Fetching ad view for ad ID: ${adId}`);
    return await this.adService.getAdView(user.id, adId, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:adId')
  editAd(@Body() createAdDto: CreateAdDto,
         @CurrentUser() user: AuthUserDto,
         @Param('adId') adId: string) {
    if (!isValidObjectId(adId)) {
      throw new BadRequestException('Invalid ad ID format');
    }
    return this.adService.createOrUpdateAd(createAdDto, user.id, adId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(@Param('id') id, @UploadedFile() image: Express.Multer.File) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ad ID format');
    }

    if (!image) {
      throw new BadRequestException('Image file is required');
    }
    return this.adService.handleImage(id, image);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('latest')
  async getLatestAds(@CurrentUser() user: AuthUserDto,){
    this.logger.log(`Fetching latest ads for user: ${user?.id ?? 'not provided'}`);
    return {
      data: await this.adService.getLatestAds(user?.id)
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('ai/generate/title')
  async generateAdTitle(@Body('title') title: string,
                        @Body('description') description?: string) {
    this.logger.log(`Generating ad title with prompt: ${title}`);
    if (!title || title.trim() === '') {
      throw new BadRequestException('Prompt is required');
    }
    return await this.adAIService.enhanceAdTitle(title, description);
  }

  @UseGuards(JwtAuthGuard)
  @Post('ai/generate/description')
  async generateAdDescription(@Body('description') prompt: string,
                              @Body('title') title?: string) {
    this.logger.log(`Generating ad title with prompt: ${prompt}`);
    if (!prompt || prompt.trim() === '') {
      throw new BadRequestException('Prompt is required');
    }
    return this.adAIService.enhanceAdDescription(prompt, title);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('search')
  async searchAds(
    @CurrentUser() user: AuthUserDto,
    @Query('q') query: string,
    @Query('localityId') localityId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    this.logger.log(`Searching ads with query: ${query}, page: ${page}, limit: ${limit}, userId: ${user?.id ?? 'not provided'}`);
    if( !query || query.trim() === '') {
      throw new BadRequestException('Query parameter is required');
    }
    if (localityId && !isValidObjectId(localityId)) {
      throw new BadRequestException('Invalid locality ID format');
    }
    return await this.adSearchService.searchAds(query, localityId, categoryId, page, limit, user?.id ?? undefined);
  }

  @Get(':q')
  async getAdBySlugOrId(@Param('q') q: string) {
    return await this.adService.getAdBySlugOrId(q)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/disable')
  async disableAd(@CurrentUser() user: AuthUserDto,
                  @Param('id') id) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ad ID format');
    }
    this.logger.log(`Disabling ad with ID: ${id} for user: ${user.id}`);
    return {
      status: await this.adService.disableAd(id, user.id)
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/enable')
  async enableAd(@CurrentUser() user: AuthUserDto,
                 @Param('id') id) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ad ID format');
    }
    this.logger.log(`Enabling ad with ID: ${id} for user: ${user.id}`);
    return {
      status: await this.adService.enableAd(id, user.id)
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/auction')
  async getAuctionInfo(
    @CurrentUser() user: AuthUserDto,
    @Param('id') adId: string){
  return await this.adService.getAuctionInfo(adId, user.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post('track-view')
  async trackViewId(
    @CurrentUser() user: AuthUserDto,
    @Body('adId') adId: string,
    @Res() res: Response
  ) {
    this.logger.log(`Tracking ad with ID: ${adId}`);
    return await this.adService.trackAdView(adId, user?.id);
  }
}
