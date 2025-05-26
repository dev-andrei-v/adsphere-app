import { Controller, Get, HttpStatus, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './user.service';
import { Roles } from '../auth/roles.decorator';
import { UserType } from './enums/user-type.enum';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('admin/users')
export class UserAdminController {
  constructor(private readonly userService: UserService) {}

  @Roles(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/')
  async getAll(@Res() res: Response,
               @Query('page') page: number = 1,
               @Query('pageSize') pageSize: number = 20,
               @Query('q') query?: string) {
    const categories = await this.userService.getAllUsers(
      page,
      pageSize,
      query
    )
    return res.status(HttpStatus.OK).json(categories);
  }
}
