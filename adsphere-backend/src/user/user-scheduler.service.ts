import { Injectable, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RegisterDto, RegisterUserTypeEnum } from '../auth/dto/register.dto';
import { fakerRO } from '@faker-js/faker';
/**
 * Class for simulate real time user signups
 */
@Injectable()
export class UserSchedulerService {
  private readonly logger = new Logger(UserSchedulerService.name);

  constructor(private readonly userService: UserService) {
    this.logger.verbose('🛠 UserSchedulerService initialized');
  }

  // @Cron(CronExpression.EVERY_HOUR)
  async handleFakeUserCreation() {
    const randomType: RegisterUserTypeEnum =
      Math.random() < 0.5
        ? RegisterUserTypeEnum.USER_INDIVIDUAL
        : RegisterUserTypeEnum.USER_BUSINESS;

    let name: string;
    let email: string;

    if (randomType === RegisterUserTypeEnum.USER_BUSINESS) {
      const companyName = fakerRO.company.name();
      const domain = fakerRO.internet.domainName();
      name = companyName;
      email = `contact@${domain}`;
    } else {
      const fullName = fakerRO.person.fullName();
      const username = fakerRO.internet.username({ firstName: fullName.split(" ")[0] });
      name = fullName;
      email = `${username.toLowerCase()}+${fakerRO.string.uuid().slice(0, 6)}@fake.ro`;
    }

    const registerDto: RegisterDto = {
      name,
      email,
      password: "Password12345!", // valid password
      type: randomType,
    };

    try {
      const user = await this.userService.createUser(registerDto);
      this.logger.verbose(`✅ Fake ${randomType} user created: ${user.email}`);
    } catch (error) {
      this.logger.warn(`⚠️ Could not create fake user: ${error.message}`);
    }
  }
}
