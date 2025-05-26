import { Injectable } from '@nestjs/common';
import { AdStatus } from '../ad/enums/ad-status.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Ad } from '../ad/schema/ad.schema';
import { Model } from 'mongoose';
import { Category } from '../category/schema/category.schema';
import { User } from 'src/user/schema/user.schema';
import { UserType } from '../user/enums/user-type.enum';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface CategoryDistributionItem {
  name: string;
  totalAds: number;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Ad.name) private adModel: Model<Ad>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}
  async getStats() {
    const date = new Date();
    const thisWeek = this.getWeekRange(date);
    const lastWeek = this.getWeekRange(
      new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000),
    );

    const [users, approved, pending, inactive] = await Promise.all([
      this.getActiveUsersCount(thisWeek, lastWeek),
      this.getAdStatsByStatuses(thisWeek, lastWeek, [AdStatus.APPROVED]),
      this.countAdsByStatus(thisWeek, AdStatus.PENDING),
      this.getAdStatsByStatuses(thisWeek, lastWeek, [
        AdStatus.ARCHIVED,
        AdStatus.REJECTED,
        AdStatus.DELETED
      ]),
    ]);

    return {
      users,
      approved,
      pending,
      inactive,
    };
  }

  async getAdTrend() {
    const today = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 13);

    const results = await this.adModel.aggregate([
      {
        $match: {
          status: AdStatus.APPROVED,
          updatedAt: {
            $gte: new Date(fourteenDaysAgo.setHours(0, 0, 0, 0)),
            $lte: new Date(today.setHours(23, 59, 59, 999))
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // completăm zilele lipsă cu 0
    const trendMap = new Map<string, number>();
    results.forEach(r => trendMap.set(r._id, r.count));

    const trend: { date: string; count: number }[] = [];

    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - 13 + i);
      const key = d.toISOString().split("T")[0];
      trend.push({
        date: key,
        count: trendMap.get(key) || 0
      });
    }

    return trend;
  }


  async getCategoryDistribution() {
    const parents = await this.categoryModel.find({
      parentId: null
    })
      .select('_id name')
      .sort('name')
      .lean();

    const results: CategoryDistributionItem[] = [];

    for (const parent of parents) {
      const subcategories = await this.categoryModel.find({ parentId: parent._id }).lean();
      const subcategoryIds = subcategories.map(cat => cat._id);

      const count = await this.adModel.countDocuments({
        categoryId: { $in: subcategoryIds }
      });
      if (count > 0)
        results.push({
          name: parent.name,
          totalAds: count,
        });
    }

    results.sort((a, b) => b.totalAds - a.totalAds);

    return results;

  }
  private getWeekRange(referenceDate: Date): DateRange {
    const date = new Date(referenceDate);
    date.setHours(0, 0, 0, 0);
    let day = date.getDay();
    if (day === 0) day = 7;

    const start = new Date(date);
    start.setDate(date.getDate() - (day - 1));
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  private async getAdStatsByStatuses(
    thisWeek: DateRange,
    lastWeek: DateRange,
    statuses: AdStatus[],
  ) {
    const current = await this.adModel.countDocuments({
      status: { $in: statuses },
      updatedAt: { $gte: thisWeek.start, $lte: thisWeek.end },
    });

    const previous = await this.adModel.countDocuments({
      status: { $in: statuses },
      updatedAt: { $gte: lastWeek.start, $lte: lastWeek.end },
    });

    const percentChange = this.calculatePercentChange(previous, current);
    return { totalCurrentWeek: current, totalLastWeek: previous, percentChange};
  }

  private calculatePercentChange(prev: number, current: number): number {
    if (prev === 0) return current > 0 ? 100 : 0;
    return +(((current - prev) / prev) * 100).toFixed(1);
  }

  private async countAdsByStatus(
    dateRange: DateRange,
    status: AdStatus
  ) {
    return this.adModel.countDocuments({
      status,
      updatedAt: { $gte: dateRange.start, $lte: dateRange.end },
    });
  }

  async getActiveUsersCount(thisWeek: DateRange, lastWeek: DateRange) {

    const current = await this.userModel.countDocuments({
      lastSeenAt: { $gte: thisWeek.start, $lte: thisWeek.end },
    });

    const previous = await this.userModel.countDocuments({
      lastSeenAt: { $gte: lastWeek.start, $lte: lastWeek.end },
    });

    const percentChange = this.calculatePercentChange(previous, current);

    return {
      totalCurrentWeek: current,
      totalLastWeek: previous,
      percentChange,
    };
  }

  async getUserTypeChart() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const results = await this.adModel.aggregate([
      {
        $match: {
          updatedAt: { $gte: fourteenDaysAgo, $lte: today },
          status: AdStatus.APPROVED // opțional: doar anunțuri relevante
        }
      },
      {
        $group: {
          _id: '$userAccountType',
          totalAds: { $sum: 1 }
        }
      }
    ]);

    const chart = {
      USER_INDIVIDUAL: 0,
      USER_BUSINESS: 0
    };

    for (const item of results) {
      if (item._id === UserType.USER_INDIVIDUAL) {
        chart.USER_INDIVIDUAL = item.totalAds;
      } else if (item._id === UserType.USER_BUSINESS) {
        chart.USER_BUSINESS = item.totalAds;
      }
    }

    return [
      { name: 'USER_INDIVIDUAL', count: chart.USER_INDIVIDUAL },
      { name: 'USER_BUSINESS', count: chart.USER_BUSINESS }
    ];
  }


  async getAdsByCounty(){
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const results = await this.adModel.aggregate([
      {
        $match: {
          status: 'approved',
          'locality.county': { $ne: null },
          updatedAt: { $gte: fourteenDaysAgo, $lte: today }
        }
      },
      {
        $group: {
          _id: '$locality.county',
          totalAds: { $sum: 1 }
        }
      },
      { $sort: { totalAds: -1 } },
      { $limit: 10 }
    ]);

    return results.map(r => ({
      county: r._id,
      totalAds: r.totalAds
    }));
  }

}
