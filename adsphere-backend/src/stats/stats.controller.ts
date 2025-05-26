import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { Roles } from '../auth/roles.decorator';
import { UserType } from '../user/enums/user-type.enum';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('admin/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Roles(UserType.ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('/widgets')
  async getStats() {
    return await this.statsService.getStats();
  }

  @Roles(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/ad-trend')
  async getAdTrend(){
    return await this.statsService.getAdTrend();
  }

  @Roles(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/category-distribution')
  async getCategoryDistribution() {
    return await this.statsService.getCategoryDistribution();
  }

  @Get('/user-type-distribution')
  async getUserTypeChart(){
    return await this.statsService.getUserTypeChart();
  }

  @Get('/ads-by-county')
  async getAdsByCounty() {
    return await this.statsService.getAdsByCounty();
  }
}
