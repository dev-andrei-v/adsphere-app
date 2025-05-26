import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Log } from './schema/log.schema';
import { Roles } from '../auth/roles.decorator';
import { UserType } from 'src/user/enums/user-type.enum';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { paginate } from '../common/pagination.util';


@Controller('admin/logs')
export class LogsController {
  constructor(
    @InjectModel(Log.name)
    private readonly logModel: Model<Log>,
  ) {
  }

  @Roles(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/')
  async getLogs( @Query('page') page: number = 1,
                 @Query('pageSize') pageSize: number = 20,
                 @Query('q') query?: string) {
    // If a query string is provided, filter logs based on it
    const logIdObject = query && query.length === 24 && /^[0-9a-fA-F]{24}$/.test(query) ? new Types.ObjectId(query) : null;
    query = query?.trim()
    const queryObject = query ? {
      $or: [
        { logType: { $regex: query, $options: 'i' } },
        { logAction: { $regex: query, $options: 'i' } },
        { by: query }, // Assuming userId is a string
        { message: { $regex: query, $options: 'i' } },
        { _id: logIdObject }, // Allow searching by log ID
      ]
    } : {};
    return paginate<Log>(this.logModel,queryObject, +page, +pageSize, { createdAt: -1 })
  }
}
