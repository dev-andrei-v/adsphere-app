import * as bcrypt from 'bcrypt';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schema/user.schema';
import { RegisterDto } from '../auth/dto/register.dto';
import { UserType } from './enums/user-type.enum';
import { paginate } from '../common/pagination.util';
import { UserAuthProvider } from './enums/user-auth-provider.enum';
import { u } from '@faker-js/faker/dist/airline-BUL6NtOJ';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async getAllUsers(page = 1, limit = 20, query?: string) {
    const userIdObject = query && query.length === 24 && /^[0-9a-fA-F]{24}$/.test(query) ? new Types.ObjectId(query) : null;

    const searchQuery = query
      ? {
          $or: [
            { _id: userIdObject },
            { type: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } },
          ],
        }
      : {};
    return paginate<User>(
      this.userModel,
      searchQuery,
      page,
      limit,
      {
        updatedAt: -1,
      },
      '-password',
    );
  }

  async userExists(email: string) {
    const user = await this.userModel.find({ email });
    return user.length > 0;
  }

  async findUserById(userId: string) {
    return this.userModel.findById(userId);
  }

  async findUserByEmail(
    email: string,
    authProvider: UserAuthProvider = UserAuthProvider.LOCAL,
  ) {
    const user = await this.userModel.find({ email, authProvider });
    return user.length > 0 ? user[0] : null;
  }

  async createUser(registerDto: RegisterDto) {
    const { email, password, name, type } = registerDto;
    const existingUser = await this.userExists(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    try {
      const newUser = new this.userModel({
        email,
        password: await this.hashPassword(password),
        name,
        type: type || UserType.USER_INDIVIDUAL,
      });

      return newUser.save();
    } catch (error) {
      throw new ConflictException('User registration failed');
    }
  }

  async createUserFromProvider(user: any, authProvider: UserAuthProvider) {
    const { email, name } = user;
    const existingUser = await this.userExists(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    try {
      const newUser = new this.userModel({
        email,
        password: null,
        name,
        type: UserType.USER_INDIVIDUAL,
        authProvider,
      });

      return newUser.save();
    } catch (error) {
      throw new ConflictException('User registration failed');
    }
  }
  private async hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }
}
