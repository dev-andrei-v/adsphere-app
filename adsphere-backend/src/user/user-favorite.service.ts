import { ConflictException, Injectable } from '@nestjs/common';
import { FavoriteAd } from './schema/favorite-ad.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types} from 'mongoose';
import { Ad } from '../ad/schema/ad.schema';

@Injectable()
export class UserFavoriteService {
  constructor(
    @InjectModel(Ad.name)
    private readonly adModel: Model<Ad>,
    @InjectModel(FavoriteAd.name)
    private readonly favoriteAdModel: Model<FavoriteAd>,
  ) {}

  async addFavoriteAd(userId: string, adId: string): Promise<FavoriteAd> {
    const existingFavorite = await this.favoriteAdModel.findOne({
      userId,
      adId});
    if (existingFavorite) {
      throw new ConflictException('Ad is already in favorites');
    }
    const adExists = await this.adModel.findById(adId)
      .select('_id userId')
      .lean();
    if (!adExists) {
      throw new ConflictException('Ad does not exist');
    }

    const isUserTryingToFavoriteOwnAd = adExists.userId.toString() === userId;
    if (isUserTryingToFavoriteOwnAd) {
      throw new ConflictException('You cannot favorite your own ad');
    }
    const favoriteAd = new this.favoriteAdModel({
      userId: new Types.ObjectId(userId),
      adId: new Types.ObjectId(adId),
    });
    return favoriteAd.save();
  }

  async removeFavoriteAd(userId: string, adId: string) {
    const favoriteAd = await this.favoriteAdModel.findOne({
      userId: new Types.ObjectId(userId),
      adId: new Types.ObjectId(adId),
    });
    if (!favoriteAd) {
      throw new ConflictException('Ad is not in favorites');
    }
    await this.favoriteAdModel.deleteOne({ _id: favoriteAd._id });
    return true
  }

  async getUserFavorites(userId: string) {
    const userIdObject = new Types.ObjectId(userId);
    const favorites = await this.favoriteAdModel
      .find({ userId: userIdObject })
      .populate({
        path: 'adId',
        populate: { path: 'locality', select: 'name county latitude longitude' }
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log(favorites)

    return favorites.map((item: any) => {
      return item.adId
    }).map(ad => {
      ad.isFavorite = true;
      return ad;
    })


  }

}
