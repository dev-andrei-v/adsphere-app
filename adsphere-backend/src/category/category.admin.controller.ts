import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post, Put, Query, Req,
  Res, UploadedFile,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { CategoryService } from './category.service';
import { CategoryRequestDto } from './dto/category-request.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { Roles } from '../auth/roles.decorator';
import { UserType } from '../user/enums/user-type.enum';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { isValidObjectId } from 'mongoose';

@Controller('/admin/categories')
export class CategoryAdminController {
  private readonly logger = new Logger(CategoryAdminController.name);

  constructor(private readonly categoryService: CategoryService) {}

  @Roles(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/')
  async getAll(
    @Res() res: Response,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    const categories = await this.categoryService.getAll(+page, +pageSize);
    return res.status(HttpStatus.OK).json(categories);
  }

  @Roles(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/:id')
  async getById(@Param('id') id: string, @Res() res: Response) {
    const category = await this.categoryService.getById(id);
    if (!category) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ error: 'Category not found' });
    }
    return res.status(HttpStatus.OK).json({
      data: category,
    });
  }

  @Roles(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() categoryRequestDto: CategoryRequestDto,
    @Res() res: Response,
  ): Promise<Response> {
    const category = await this.categoryService.update(id, categoryRequestDto);

    return res.status(HttpStatus.OK).json({
      data: category,
    });
  }

  @Roles(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/')
  async create(
    @Body() categoryRequestDto: CategoryRequestDto,
    @Res() res: Response,
    @CurrentUser() user: AuthUserDto,
  ): Promise<Response> {
    const category = await this.categoryService.create(categoryRequestDto);

    return res.status(HttpStatus.CREATED).json({
      data: category,
    });
  }

  @Roles(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid category ID format');
    }
    if (!image) {
      throw new BadRequestException('Image file is required');
    }
    return this.categoryService.handleImage(id, image);
  }

}
