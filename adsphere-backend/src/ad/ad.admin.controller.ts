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
  Put,
} from '@nestjs/common';
import { AdService } from './ad.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Response } from 'express';
import { Roles } from '../auth/roles.decorator';
import { UserType } from '../user/enums/user-type.enum';
import { RolesGuard } from '../auth/roles.guard';
import { AdAdminService } from './ad.admin.service';

@Controller('/admin/ads')
export class AdAdminController {
  constructor(private readonly adAdminService: AdAdminService) {}

  @Roles(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/')
  getAds(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('q') query?: string
  ) {
    return this.adAdminService.getAds(+page, +pageSize, query);
  }

  @Roles(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/:id')
  async getAd(@Param('id') id: string) {
    return {
      data: await this.adAdminService.getAdById(id),
    };
  }

  @Roles(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put('/:id')
  async updateAd(
    @CurrentUser() user: AuthUserDto,
    @Body() updateAdDto: UpdateAdDto, @Param('id') id: string) {
    return {
      data: await this.adAdminService.updateAd(id, updateAdDto, user),
    };
  }
}
