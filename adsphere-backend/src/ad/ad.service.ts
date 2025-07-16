import {
  BadRequestException, Inject,
  Injectable, Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAdDto } from './dto/create-ad.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Ad } from './schema/ad.schema';
import { Model, Types } from 'mongoose';
import { Locality } from '../locality/schema/locality.schema';
import { Category } from '../category/schema/category.schema';
import { AdStatus } from './enums/ad-status.enum';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { RabbitMqPattern, RabbitMqService } from '../common/queue/rabbit-mq.service';
import { paginate } from '../common/pagination.util';
import { User } from '../user/schema/user.schema';
import { AdSearchService } from './ad-search.service';
import { Message } from '../message/schema/message.schema';
import { FavoriteAd } from '../user/schema/favorite-ad.schema';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Log, LogAction, LogType } from '../log/schema/log.schema';
import { AdView } from './schema/ad-view.schema';
import { AdCurrencyEnum } from './enums/ad-currency.enum';

@Injectable()
export class AdService {
  private readonly LATEST_ADS_LIMIT = 32;
  private readonly logger = new Logger(AdService.name);

  constructor(
    @InjectModel(Ad.name) private adModel: Model<Ad>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Locality.name) private localityModel: Model<Locality>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(FavoriteAd.name) private favoriteAdModel: Model<FavoriteAd>,
    @InjectModel(Log.name) private logModel: Model<Log>,
    @InjectModel(AdView.name) private adViewModel: Model<AdView>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly rabbitMqService: RabbitMqService,
    private readonly adSearchService: AdSearchService,
    private readonly elastic: ElasticsearchService,
  ) {}

  async createOrUpdateAd(
    createAdDto: CreateAdDto,
    userId: string,
    adId?: string,
  ) {
    if (userId === undefined) {
      throw new UnauthorizedException('User id is undefined');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const locality = await this.localityModel.findById(createAdDto.localityId);
    if (!locality) {
      throw new NotFoundException(
        `Locality with id ${createAdDto.localityId} not found`,
      );
    }
    const category = await this.categoryModel.findOne({
      _id: createAdDto.categoryId,
    });
    if (!category) {
      throw new NotFoundException(
        `Category with id ${createAdDto.categoryId} not found`,
      );
    }

    this.checkAttributesForCreate(createAdDto, category);

    let ad;
    if (adId) {
      const existingAd = await this.adModel.findById(adId);
      if (!existingAd) {
        throw new NotFoundException(`Ad with id ${adId} not found`);
      }
      if (
        existingAd.userId.toString() !== (user._id as Types.ObjectId).toString()
      ) {
        throw new UnauthorizedException(
          'You are not allowed to update this ad',
        );
      }

      existingAd.title = createAdDto.title;
      existingAd.description = createAdDto.description;
      existingAd.price = createAdDto.price;
      existingAd.currency = createAdDto.currency as AdCurrencyEnum;
      existingAd.priceType = createAdDto.priceType;
      existingAd.attributes = createAdDto.attributes;
      existingAd.locality = locality;
      existingAd.categoryId = new Types.ObjectId(createAdDto.categoryId);
      await existingAd.save();
      ad = existingAd;
    } else {
      ad = new this.adModel({
        ...createAdDto,
        userId: user._id,
        userAccountType: user.type,
        categoryId: new Types.ObjectId(createAdDto.categoryId),
        category: {
          id: category._id,
          name: category.name,
          slug: category.slug,
        },
        locality: {
          id: locality!._id,
          name: locality!.name,
          county: locality!.county,
          latitude: locality!.latitude,
          longitude: locality!.longitude,
        },
      });

      await ad.save();
    }

    await this.rabbitMqService.publish(RabbitMqPattern.AD_PROCESS, {
      adId: ad.id.toString(),
      date: ad.createdAt.toISOString(),
    });

    await this.adSearchService.indexAd(ad);

    if (!adId) {
      await new this.logModel({
        logType: LogType.ACTION,
        logAction: LogAction.POST_AD,
        message: `Ad with id ${ad.id} created by user ${userId}`,
        by: userId,
        category: category.name,
      }).save();
    } else {
      await new this.logModel({
        logType: LogType.ACTION,
        logAction: LogAction.EDIT_AD,
        message: `Ad with id ${ad.id} updated by user ${userId}`,
        by: userId,
        category: category.name,
      }).save();
    }

    return ad;
  }

  async handleImage(adId: string, file: Express.Multer.File) {
    const ad = await this.adModel.findById(adId);
    if (!ad) {
      throw new NotFoundException(`Ad with id ${adId} not found`);
    }

    const uploadedImage = await this.cloudinaryService.uploadImage(file);
    if (!uploadedImage) {
      throw new BadRequestException('Image upload failed');
    }
    const isFirstImage = ad.images.length === 0;
    if (uploadedImage.secureUrl != null && uploadedImage.publicId != null) {
      ad.images.push({
        url: uploadedImage.secureUrl,
        publicId: uploadedImage.publicId,
        isFeatured: isFirstImage,
      });
      ad.save();
      return {
        url: uploadedImage.secureUrl,
        publicId: uploadedImage.publicId,
      };
    } else {
      throw new BadRequestException(
        'Image upload failed, no URL or public ID returned',
      );
    }
  }
  private checkAttributesForCreate(dto: CreateAdDto, category: any) {
    if (!dto.attributes || Object.keys(dto.attributes).length === 0) {
      // throw new BadRequestException(`Ad should have at least one attribute`);
    }
    const categoryAttributesMap = new Map<string, any>();
    for (const attribute of category.attributes) {
      categoryAttributesMap.set(attribute.key, attribute);
    }

    for (const [key, value] of Object.entries(dto.attributes)) {
      if (!categoryAttributesMap.has(key)) {
        throw new BadRequestException(
          `Attribute ${key} does not exist in category ${category.name}`,
        );
      }

      const attributeTemplate = categoryAttributesMap.get(key);
      switch (attributeTemplate.type) {
        case 'text':
          if (typeof value !== 'string') {
            throw new BadRequestException(
              `Attribute "${key}" with value "${value}" is not a string in category "${category.name}"`,
            );
          }
          if (
            attributeTemplate.validation &&
            attributeTemplate.validation.regex
          ) {
            const regex = new RegExp(attributeTemplate.validation.regex);
            if (!regex.test(value)) {
              throw new BadRequestException(
                `Attribute "${key}" with value "${value}" does not match the regex in category "${category.name}"`,
              );
            }
          }
          break;
        case 'number':
          const numberValue = +value;
          if (isNaN(numberValue)) {
            throw new BadRequestException(
              `Attribute "${key}" with value "${value}" is not a number in category ${category.name}`,
            );
          }
          if (
            attributeTemplate.validation &&
            attributeTemplate.validation.minValue &&
            numberValue < attributeTemplate.validation.minValue
          ) {
            throw new BadRequestException(
              `Attribute "${key}" with value "${value}" is less than the minimum value in category "${category.name}"`,
            );
          }
          if (
            attributeTemplate.validation &&
            attributeTemplate.validation.maxValue &&
            numberValue > attributeTemplate.validation.maxValue
          ) {
            throw new BadRequestException(
              `Attribute "${key}" with value "${value}" is greater than the maximum value in category "${category.name}"`,
            );
          }
          break;
        case 'select':
          if (!attributeTemplate.options.includes(value)) {
            throw new BadRequestException(
              `Attribute "${key}" with value "${value}" does not exist in category ${category.name}`,
            );
          }
          break;
      }
    }
    return true;
  }

  async getAdBySlugOrId(query: string) {
    const isValidObjectId = (id: string) => {
      return (
        Types.ObjectId.isValid(id) && new Types.ObjectId(id).toString() === id
      );
    };
    let ad;
    if (isValidObjectId(query)) {
      ad = await this.adModel.findOne({ _id: new Types.ObjectId(query) });
    } else {
      ad = await this.adModel.findOne({ slug: query });
    }
    if (!ad) {
      throw new NotFoundException(`Ad with slug/ID ${query} not found`);
    }
    const user = await this.userModel
      .findById(ad.userId)
      .select('id name type createdAt');
    const category = await this.categoryModel
      .findById(ad.categoryId)
      .select('id name slug attributes');
    return {
      ad,
      seller: user,
      category,
    };
  }

  async getLatestAds(userId?: string) {
    // const ads = await this.adModel
    //   .find({ status: AdStatus.APPROVED })
    //   .select(
    //     '_id title price images currency locality slug createdAt updatedAt slug',
    //   )
    //   .sort({ updatedAt: -1 })
    //   .limit(this.LATEST_ADS_LIMIT)
    const ads = await this.adModel.aggregate([
      { $match: { status: AdStatus.APPROVED } },
      {
        $sort: {
          updatedAt: -1
        }
      },
      {
        $group: {
          _id: '$title',
          doc: { $first: '$$ROOT' }
        }
      },
      {
        $replaceWith: '$doc'
      },
      {
        $sort: { updatedAt: -1 }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          price: 1,
          images: 1,
          currency: 1,
          locality: 1,
          slug: 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      { $limit: this.LATEST_ADS_LIMIT }
    ]);

    if (userId) {
      const favoriteAds = this.favoriteAdModel.find({
        userId: userId ? new Types.ObjectId(userId) : null,
      });
      const favoriteAdsIds = await favoriteAds.select('adId').lean();
      const favoriteAdIdsSet = new Set(
        favoriteAdsIds.map((fav) => fav.adId.toString()),
      );
      ads.forEach((ad) => {
        // @ts-ignore
        ad.isFavorite = favoriteAdIdsSet.has(ad._id.toString());
      });
    }

    return ads;
  }

  async getAdsByUserId(userId: string) {
    return this.adModel
      .find({ userId: new Types.ObjectId(userId) })
      .select(
        'id title price images currency locality slug status createdAt updatedAt slug categoryId',
      )
      .sort({ updatedAt: -1 })
      .populate('categoryId', 'name slug');
  }

  async getAdsByCategoryIds(
    categories: string[],
    page = 1,
    limit = 20,
    filters: Record<string, any>,
  ) {
    const categoryObjectIds = categories.map((id) => new Types.ObjectId(id));
    let filterQuery: any = {
      categoryId: { $in: categoryObjectIds },
      status: AdStatus.APPROVED,
    };
    let sort: Record<string, 1 | -1> = { updatedAt: -1 };
    this.logger.log('Filters: ', filters);
    if (filters != null) {
      if (
        filters['minPrice'] != null &&
        filters['maxPrice'] !== '' &&
        filters['currency'] != null
      ) {
        filterQuery['price'] = {
          $gte: +filters['minPrice'],
          $lte: +filters['maxPrice'],
        };
        filterQuery['currency'] = filters['currency'];
      }
      if (filters['accountType'] != null) {
        filterQuery['userAccountType'] = filters['accountType'];
      }
      if (filters['priceType'] != null) {
        filterQuery['priceType'] = filters['priceType'];
      }
      if (filters['sort'] && typeof filters['sort'] === 'string') {
        const [field, direction] = filters['sort'].split('_');
        if (field.toLowerCase() === 'date') {
          sort = {
            updatedAt: direction === 'asc' ? 1 : -1,
          };
        }
        if (field.toLowerCase() === 'price') {
          sort = {
            price: direction === 'asc' ? 1 : -1,
          };
        }
      }

      if (filters['attributes']) {
        const attributes = filters['attributes'];
        for (const [key, value] of Object.entries(attributes)) {
          if (value != null && value !== '') {
            if (Array.isArray(value)) {
              filterQuery[`attributes.${key}`] = { $in: value };
            } else {
              filterQuery[`attributes.${key}`] = value;
            }
          }
        }
      }

      if (filters['localityId']) {
        const localityId = new Types.ObjectId(filters['localityId']);
        filterQuery['locality._id'] = localityId;
      }

      if (filters['query']) {
        const esQuery = {
          bool: {
            must: [
              {
                multi_match: {
                  query: filters['query'],
                  fields: ['title^3', 'description'],
                  fuzziness: 'AUTO',
                },
              },
            ],
          },
        };
        const result = await this.elastic.search({
          index: 'ads',
          query: esQuery,
          size: 1000,
        });

        this.logger.log(`elastic search result: ${JSON.stringify(result)}`);

        const ids = result.hits.hits.map(
          (hit: any) => new Types.ObjectId(hit._id),
        );

        filterQuery = {
          ...filterQuery,
          _id: { $in: ids },
        };
      }

      this.logger.log(`Filter query: ${JSON.stringify(filterQuery)}`);
    }
    return paginate<Ad>(this.adModel, filterQuery, page, limit, sort);
  }

  async disableAd(adId: string, userId: string) {
    const ad = await this.adModel.findById(adId);
    if (!ad) {
      throw new NotFoundException(`Ad with id ${adId} not found`);
    }
    if (ad.userId.toString() !== userId) {
      throw new UnauthorizedException('You are not allowed to disable this ad');
    }
    if (ad.status != AdStatus.APPROVED) {
      throw new BadRequestException('Ad is not approved, cannot disable it');
    }
    ad.status = AdStatus.DELETED;
    await ad.save();
    return true;
  }

  async enableAd(adId: string, userId: string) {
    const ad = await this.adModel.findById(adId);
    if (!ad) {
      throw new NotFoundException(`Ad with id ${adId} not found`);
    }
    if (ad.userId.toString() !== userId) {
      throw new UnauthorizedException('You are not allowed to enable this ad');
    }
    ad.status = AdStatus.APPROVED;
    await ad.save();
    return true;
  }

  async getAuctionInfo(adId: string, authUserId: string) {
    const adIdObject = new Types.ObjectId(adId);
    const authUserIdObject = new Types.ObjectId(authUserId);
    const ad = await this.adModel.findById(adIdObject);
    if (!ad) {
      throw new NotFoundException(`Ad with id ${adId} not found`);
    }
    if (ad.priceType !== 'auction') {
      throw new BadRequestException(`Ad with id ${adId} is not an auction ad`);
    }
    const messages = await this.messageModel
      .find({
        adId: adIdObject,
        offer: { $exists: true },
        'offer.type': 'auction',
      })
      .sort({ 'offer.amount': -1 })
      .lean();

    const authUserParticipated = messages.some((message) =>
      message.senderId.equals(authUserIdObject),
    );
    let minPrice = ad?.price ? ad.price : 0;
    const totalAuctions = messages.length;

    if (totalAuctions > 0) {
      minPrice = messages[0]?.offer?.amount ?? minPrice;
    }

    const lastAuction =
      messages.length > 1 ? (messages[1]?.offer?.amount ?? minPrice) : minPrice;

    const increasePercentage =
      totalAuctions > 0
        ? (((minPrice - lastAuction) / lastAuction) * 100).toFixed(2)
        : '0.00';

    return {
      data: {
        totalAuctions,
        minPrice,
        increasePercentage,
        authUserParticipated,
      },
    };
  }

  async trackAdView(adId: string, userId: string | undefined) {
    const adIdObject = new Types.ObjectId(adId);
    const ad = await this.adModel.findById(adIdObject);
    if (!ad) {
      throw new NotFoundException(`Ad with id ${adId} not found`);
    }
    const adView = new this.adViewModel({
      adId: adIdObject,
      userId: userId ? new Types.ObjectId(userId) : undefined,
      deviceId: userId ? undefined : 'guest',
      viewedAt: new Date(),
    });

    await adView.save();
    ad.viewsCounter = (ad.viewsCounter || 0) + 1;
    await ad.save();
    this.logger.log(`Ad view tracked for adId: ${adId}, userId: ${userId}`);
    return true;
  }

  async getAdView(userId: string, adId: string, id: string | undefined) {
    const adIdObject = new Types.ObjectId(adId);
    const ad = await this.adModel.findById(adIdObject);
    if (!ad) {
      throw new NotFoundException(`Ad with id ${adId} not found`);
    }

    if(ad.userId.toString() != userId) {
      throw new UnauthorizedException('You are not allowed to view this ad');
    }

      return {
        data: ad
      };
    }
}
