import { BadRequestException, Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { AdService } from '../ad/ad.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UserFavoriteService } from './user-favorite.service';
import { isValidObjectId, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';

@Controller('users')
export class UserController {
  constructor(
    private readonly adService: AdService,
    private readonly userFavoriteService: UserFavoriteService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  @Get('me/ads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getUserAds(@CurrentUser() user: AuthUserDto) {
    return {
      data: await this.adService.getAdsByUserId(user.id),
    };
  }

  @Get('me/favorites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getUserFavorites(@CurrentUser() user: AuthUserDto) {
    const favorites = await this.userFavoriteService.getUserFavorites(user.id);
    return {
      data: favorites,
    };
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getUserProfile(@CurrentUser() user: AuthUserDto) {
    return {
      data: ["TODO", user]
    };
  }

  @Post('me/favorites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async addAdToFavorites(@CurrentUser() user: AuthUserDto,
                         @Body('adId') adId: string) {
    if(!adId) {
      throw new BadRequestException("adId is required");
    }
    if(!isValidObjectId(adId)) {
      throw new BadRequestException("Invalid adId format");
    }
    return this.userFavoriteService.addFavoriteAd(user.id, adId);
  }

  @Delete('me/favorites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async removeAdFromFavorites(@CurrentUser() user: AuthUserDto,
                              @Body('adId') adId: string) {
    if(!adId) {
      throw new BadRequestException("adId is required");
    }
    if(!isValidObjectId(adId)) {
      throw new BadRequestException("Invalid adId format");
    }
    return this.userFavoriteService.removeFavoriteAd(user.id, adId);
  }

  @Post('me/seen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async seen(@CurrentUser() user: AuthUserDto) {
    const result = await this.userModel.findByIdAndUpdate(
      user.id,
      { lastSeenAt: new Date() },
      { new: true }
    ).select('lastSeenAt');
    if (!result) {
      throw new BadRequestException('User not found');
    }
    return { lastSeenAt: result.lastSeenAt };
  }
}
