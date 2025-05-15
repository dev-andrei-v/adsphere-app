import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ad } from './schema/ad.schema';
import { Category } from '../category/schema/category.schema';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaginatedResult } from '../common/pagination.util';
import { AdStatus } from './enums/ad-status.enum';
import { Locality } from '../locality/schema/locality.schema';
import { FavoriteAd } from '../user/schema/favorite-ad.schema';

@Injectable()
export class AdSearchService implements OnModuleInit {
  private readonly logger = new Logger(AdSearchService.name);

  constructor(
    private readonly elastic: ElasticsearchService,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Ad.name) private adModel: Model<Ad>,
    @InjectModel(Locality.name) private localityModel: Model<Locality>,
    @InjectModel(FavoriteAd.name) private favoriteAdModel: Model<FavoriteAd>,
  ) {}

  async onModuleInit() {
    // await this.syncMissingAdsToElastic(); // rulează imediat
  }

  public async indexAd(ad: Ad) {
    const category = await this.categoryModel.findOne({_id: ad.categoryId});
    // @ts-ignore
    const adId = ad._id.toString();
    await this.elastic.index({
      index: 'ads',
      id: adId,
      document: {
        title: ad.title,
        description: ad.description,
        category: category?.name,
        location: ad.locality,
      },
    });
    this.logger.log(`✅ Indexed to elastic search ad with id ${ad._id}`);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  private async syncMissingAdsToElastic() {
    this.logger.log('🔄 Started to sync missing ads to elastic.');

    const ads = await this.adModel.find().lean();

    for (const ad of ads) {
      try {
        const exists = await this.elastic.exists({
          index: 'ads',
          id: ad._id.toString(),
        });

        if (!exists) {
          await this.indexAd(ad);
        }
      } catch (error) {
        this.logger.warn(`❌ Error when indexing ad id ${ad._id} to elastic: ${error.message}`);
      }
    }

    this.logger.log('✅ Finished syncing missing ads to elastic search.');
  }

  async searchAds(query: string, localityId?: string, categoryId?: string, page = 1, limit = 10, userId?: string): Promise<PaginatedResult<Ad>> {
    const from = (page - 1) * limit;

    const searchQuery: any = {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: ['title^3', 'description', 'category', 'location'],
              fuzziness: 'AUTO',
              operator: 'and'
            },
          },
        ],
        filter: [],
      },
    };

    let locality: Locality | null = null;
    let category: Category | null = null;

    if (categoryId) {
      searchQuery.bool.filter.push({
        term: { category: categoryId },
      });
      category = await this.categoryModel.findById(categoryId).lean();
    }

    if (localityId) {
      searchQuery.bool.filter.push({
        term: { 'location._id': localityId },
      });
      locality = await this.localityModel.findById(localityId).lean();
    }

    const result = await this.elastic.search({
      index: 'ads',
      query: searchQuery,
      from,
      size: limit,
    });

    let total = typeof result.hits.total === 'number'
      ? result.hits.total
      : result.hits.total?.value ?? 0;

    const ids = result.hits.hits.map((hit: any) => new Types.ObjectId(hit._id));

    const ads = await this.adModel
      .find({
        _id: { $in: ids },
        status: AdStatus.APPROVED,
      })
      .sort({ updatedAt: -1 }) // sort by updatedAt to get the most recent ads first
      .lean();

    const otherAdsCountByNotApproved = await this.adModel.countDocuments({
      _id: { $in: ids },
      status: { $ne: AdStatus.APPROVED },
    })

    total -= otherAdsCountByNotApproved;

    // If userId is provided, check for each ad if it is favorited by the user
    // console.log(`Ads: ${ads.length}, UserId: ${userId}`);
    if (userId) {
      const favoriteAds = await this.favoriteAdModel.find({userId: new Types.ObjectId(userId), adId: { $in: ids } }).lean();
      const favoriteAdIds = new Set(favoriteAds.map(fav => fav.adId.toString()));
      ads.forEach((ad: any) => {
        ad.isFavorite = favoriteAdIds.has(ad._id.toString());
      });
    }

    // const adsById: Map<string, Ad> = new Map(
    //   ads.map(ad => [ad._id.toString(), ad])
    // );
    //
    // const sortedAds: Ad[] = ids
    //   .map(id => adsById.get(id))
    //   .filter((ad): ad is Ad => ad !== undefined);

    const response = {
      data: ads,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      pageSize: limit,
      locality,
      category,
    };

    return response;
  }

}
