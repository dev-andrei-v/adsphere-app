import { Injectable, NotFoundException } from '@nestjs/common';
import { paginate } from '../common/pagination.util';
import { Ad } from './schema/ad.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category } from '../category/schema/category.schema';
import { Locality } from '../locality/schema/locality.schema';
import { UpdateAdDto } from './dto/update-ad.dto';
import { Log, LogAction, LogType } from '../log/schema/log.schema';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { AdStatus } from './enums/ad-status.enum';
import { RabbitMqPattern, RabbitMqService } from '../common/queue/rabbit-mq.service';

@Injectable()
export class AdAdminService {
  constructor(
    @InjectModel(Ad.name) private adModel: Model<Ad>,
    @InjectModel(Log.name)
    private readonly logModel: Model<Log>,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  async getAds(page = 1, limit = 20, queryStr?: string) {
    //Make a query object based on the query string
    //Search OR by id, title, slug
    const objectId = queryStr && Types.ObjectId.isValid(queryStr) ? new Types.ObjectId(queryStr) : null;
    const query = queryStr ? {
      $or: [
        { title: { $regex: queryStr, $options: 'i' } },
        { slug: { $regex: queryStr, $options: 'i' } },
        { _id: objectId },
        { userId: objectId },
      ]
    } : {};
    return paginate<Ad>(this.adModel, query, page, limit, { createdAt: -1 });
  }

  async getAdById(id: string) {
    const ad = await this.adModel.findById(id);
    if (!ad) {
      throw new NotFoundException(`Ad with id ${id} not found`);
    }
    return ad;
  }

  async updateAd(id: string, updateAdDto: UpdateAdDto, adminUser: AuthUserDto) {
    // Check if the ad exists
    const ad = await this.adModel.findById(id);
    if (!ad) {
      throw new NotFoundException(`Ad with id ${id} not found`);
    }
    const copyAd = ad.toObject();
    ad.set(updateAdDto);

    const statusChanged = copyAd.status !== ad.status;
    const msgStatusChanged = `Status changed from ${copyAd.status.toUpperCase()} to ${ad.status.toUpperCase()}`;

    if(ad.status == AdStatus.PENDING) {
      //Resend the ad to the processing queue
      //For example, if the ad was approved and then set to pending again
      await this.rabbitMqService.publish(RabbitMqPattern.AD_PROCESS, {
        adId: ad.id.toString(),
        date: ad.createdAt.toISOString(),
      });
    }
    const log = new this.logModel({
      logType: LogType.ACTION,
      logAction: LogAction.EDIT_AD,
      by: adminUser.id,
      message: `Ad ${ad._id} updated by admin ${adminUser.email} ${statusChanged ? ' | ' + msgStatusChanged : ''}`,
      adId: ad._id,
    })
    // Save the log entry
    await log.save();
    // Update the ad

    await ad.save();
    return ad;

  }
}
