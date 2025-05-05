import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post, Query, Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CategoryService } from './category.service';


@Controller('/categories')
export class CategoryController {
  private readonly logger = new Logger(CategoryController.name);

  constructor(private readonly categoryService: CategoryService) {}


  @Get('/featured')
  async getFeatured(@Res() res: Response) {
    const categories = await this.categoryService.getFeatured();
    return res.status(HttpStatus.OK).json({ data: categories });
  }

  @Get('/tree')
  async getCategoryTree(@Res() res: Response) {
    const categories = await this.categoryService.getCategoryTree();
    return res.status(HttpStatus.OK).json({ data: categories });
  }

  @Get('/:slug')
  async getBySlug(@Param('slug') slug: string, @Res() res: Response) {
    const category = await this.categoryService.getBySlug(slug);
    if (!category) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ error: 'Category not found' });
    }
    return res.status(HttpStatus.OK).json({ data: category });
  }

  @Get(':slug/subcategories')
  async getSubcategories(@Param('slug') parentSlug: string, @Res() res: Response) {
    const data = await this.categoryService.getSubcategoriesBySlug(parentSlug);
    return res.status(HttpStatus.OK).json({ data });
  }

  @Post(':slug/ads')
  async getAdsByCategory(@Res() res: Response,
                         @Param('slug') slug: string,
                         @Body() body) {
    const filters = body?.filters;
    const page = body?.params?.page || 1;
    const pageSize = body?.params?.pageSize || 20;

    const ads = await this.categoryService.getAdsByCategory(slug, +page, +pageSize, filters);
    return res.status(HttpStatus.OK).json(ads);
  }
}
