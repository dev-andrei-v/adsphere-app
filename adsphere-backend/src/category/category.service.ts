import {
  BadRequestException,
  ConflictException,
  Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { CategoryRequestDto } from './dto/category-request.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from './schema/category.schema';
import { Model, Types } from 'mongoose';
import slugify from 'slugify';
import { paginate } from '../common/pagination.util';
import { plainToInstance } from 'class-transformer';
import { FeaturedCategoryDto } from './dto/featured-category.dto';
import { CategoryTreeDto } from './dto/category-tree.dto';
import { AdService } from '../ad/ad.service';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    private readonly adService: AdService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  private readonly logger = new Logger(CategoryService.name);

  async getAll(page = 1, limit = 20) {
    return paginate<Category>(this.categoryModel, {}, page, limit, {
      updatedAt: -1,
    });
  }

  async getCategoryTree(): Promise<CategoryTreeDto[]> {
    const categories = await this.categoryModel
      .find({ isEnabled: true })
      .sort({ name: 1, slug: 1 })
      .lean();

    const categoryMap = new Map<string, any>();
    const tree: any[] = [];

    // Index all categories
    categories.forEach((cat) => {
      categoryMap.set(cat._id.toString(), {
        ...cat,
        id: cat._id.toString(),
        subcategories: [],
      });
    });

    // Build tree
    categories.forEach((cat) => {
      const parentId = cat.parentId?.toString();

      if (parentId && categoryMap.has(parentId)) {
        categoryMap
          .get(parentId)
          .subcategories.push(categoryMap.get(cat._id.toString()));
      } else if (!parentId) {
        tree.push(categoryMap.get(cat._id.toString())); // top-level
      }
    });

    const sortByName = (nodes: any[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name)); // sort alfabetic
      nodes.forEach((node) => {
        if (node.subcategories?.length > 0) {
          sortByName(node.subcategories); // recursiv pe copii
        }
      });
    };

    sortByName(tree);

    return plainToInstance(CategoryTreeDto, tree, {
      excludeExtraneousValues: true,
    });
  }

  async getFeatured() {
    const result = await this.categoryModel
      .aggregate([
        {
          $match: {
            parentId: null,
            isFeatured: true,
            isEnabled: true,
          },
        },
        {
          $project: {
            _id: 0,
            id: '$_id',
            name: 1,
            slug: 1,
            image: 1,
            isEnabled: 1,
            isFeatured: 1,
          },
        },
      ])
      .sort({ featuredOrderIndex: 1 });

    return plainToInstance(FeaturedCategoryDto, result, {
      excludeExtraneousValues: true,
    });
  }

  async getBySlug(slug: string) {
    return this.categoryModel.findOne({ slug, isEnabled: true });
  }

  async getById(id: string) {
    const [category] = await this.categoryModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      {
        $project: {
          name: 1,
          slug: 1,
          attributes: {
            $sortArray: {
              input: '$attributes',
              sortBy: { label: 1 },
            },
          },
          parentId: 1,
          image: 1,
          isFeatured: 1,
          isEnabled: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    if (!category) {
      throw new ConflictException('Category not found');
    }
    return category;
  }

  async create(dto: CategoryRequestDto) {
    this.validateAttributesForCreate(dto);
    this.sortAttributesForCreate(dto);

    const baseSlug = slugify(dto.name, {
      lower: true,
      strict: true,
    });

    const slug = await this.generateUniqueSlug(baseSlug);

    const category = new this.categoryModel({
      ...dto,
      slug,
      parentId: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
    });

    return category.save();
  }

  async update(id: string, categoryRequestDto: CategoryRequestDto) {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new ConflictException('Category not found');
    }
    this.validateAttributesForCreate(categoryRequestDto);
    this.sortAttributesForCreate(categoryRequestDto);

    const baseSlug = slugify(categoryRequestDto.name, {
      lower: true,
      strict: true,
    });
    const slug = await this.generateUniqueSlug(baseSlug);
    //update category
    return this.categoryModel.findByIdAndUpdate(
      id,
      {
        ...categoryRequestDto,
        slug,
        parentId: categoryRequestDto.parentId
          ? new Types.ObjectId(categoryRequestDto.parentId)
          : null,
      },
      { new: true },
    );
  }

  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let count = 0;

    while (await this.categoryModel.exists({ slug })) {
      count++;
      slug = `${baseSlug}-${count}`;
    }

    return slug;
  }

  private validateAttributesForCreate(dto: CategoryRequestDto) {
    if (!dto.attributes) return;

    for (const attribute of dto.attributes) {
      if (attribute.validation && Object.keys(attribute.validation).length === 0) {
        attribute.validation = undefined;
      }

      const { type, key, options, unit, validation } = attribute;

      switch (type) {
        case 'text':
          if (unit) {
            throw new BadRequestException(
              `Attribute '${key}' of type 'text' cannot have a unit`,
            );
          }
          if (options && options.length > 0) {
            throw new BadRequestException(
              `Attribute '${key}' of type 'text' cannot have options`,
            );
          }
          if (
            validation?.minValue !== undefined ||
            validation?.maxValue !== undefined
          ) {
            throw new BadRequestException(
              `Attribute '${key}' of type 'text' cannot have min or max`,
            );
          }
          break;

        case 'number':
          if (unit) {
            throw new BadRequestException(
              `Attribute '${key}' of type 'number' cannot have a unit`,
            );
          }
          if (options && options.length > 0) {
            throw new BadRequestException(
              `Attribute '${key}' of type 'number' cannot have options`,
            );
          }
          if (validation?.regex) {
            throw new BadRequestException(
              `Attribute '${key}' of type 'number' cannot have regex`,
            );
          }
          break;

        case 'select':
          if (!options || options.length === 0) {
            throw new BadRequestException(
              `Attribute '${key}' of type 'select' must have options`,
            );
          }
          if (unit && unit.length > 0) {
            throw new BadRequestException(
              `Attribute '${key}' of type 'select' must not have unit`,
            );
          }
          if (validation !== undefined && Object.keys(validation).length > 0) {
            throw new BadRequestException(
              `Attribute '${key}' of type 'select' must not have validation`,
            );
          }
          break;

        default:
          throw new BadRequestException(`Unknown attribute type '${type}'`);
      }
    }
  }

  private sortAttributesForCreate(dto: CategoryRequestDto) {
    if (!dto.attributes) return;

    dto.attributes.sort((a, b) =>
      a.label.localeCompare(b.label, 'ro', { sensitivity: 'base' }),
    );

    dto.attributes.forEach((attribute) => {
      if (attribute.options) {
        attribute.options.sort((a: string, b: string) =>
          a.localeCompare(b, 'ro', { sensitivity: 'base' }),
        );
      }
    });
  }

  async getSubcategoriesBySlug(parentSlug: string) {
    const parent = await this.categoryModel
      .findOne({ slug: parentSlug })
      .select('_id name');
    if (!parent) {
      throw new ConflictException('Parent category not found');
    }
    const subcategories = await this.categoryModel
      .find({ parentId: parent._id, isEnabled: true })
      .sort({ name: 1 })
      .lean();

    return {
      parent,
      subcategories
    }
  }

  async getAdsByCategory(slug: string, page: number = 1, limit: number = 20,
                         filters: any = null) {
    const category = await this.categoryModel
      .findOne({ slug })
      .select('_id parentId')
      .lean();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const hasParent = category.parentId !== null;
    const categoryIds: string[] = [];

    if(filters != null && filters.subcategoryId) {
      categoryIds.push(filters.subcategoryId);
    } else
    if (!hasParent) {
      const subcategories = await this.categoryModel
        .find({ parentId: category._id })
        .select('_id');

      for (const subcategory of subcategories) {
        categoryIds.push(subcategory.id);
      }
    }
    categoryIds.push(category._id.toString());
    return this.adService.getAdsByCategoryIds(categoryIds, page, limit, filters);
  }

  async handleImage(id: string, file: Express.Multer.File) {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    const uploadedImage = await this.cloudinaryService.uploadImage(file);
    if (!uploadedImage) {
      throw new BadRequestException('Image upload failed');
    }
    if(uploadedImage.secureUrl != null && uploadedImage.publicId != null) {
      category.image = {
        url: uploadedImage.secureUrl,
        publicId: uploadedImage.publicId,
      }

      await category.save();
    }
    else {
      throw new BadRequestException('Image upload failed, no URL or public ID returned');
    }

    return {
      url: uploadedImage.secureUrl,
      publicId: uploadedImage.publicId,
    };

  }
}
