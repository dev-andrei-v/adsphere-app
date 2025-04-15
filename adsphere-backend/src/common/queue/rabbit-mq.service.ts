import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export enum RabbitMqPattern {
  AD_PROCESS = 'ad.process',
}
@Injectable()
export class RabbitMqService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMqService.name);

  constructor(
    @Inject('ADSPHERE_QUEUE')
    private readonly client: ClientProxy,
  ) {
    this.logger.verbose('🛠 RabbitMqService constructor called');
  }

  async onModuleInit() {
    this.logger.verbose('🔗 Connecting RabbitMQ client...');
    await this.client.connect();
    this.logger.verbose('🔗 RabbitMQ client connected');
  }

  /** Fire-and-forget */
  async publish(pattern: string, data: any): Promise<void> {
    this.logger.log(`→ emit '${pattern}' with payload ${JSON.stringify(data)}`);
    // use firstValueFrom instead of deprecated toPromise()
    await firstValueFrom(this.client.emit(pattern, data));
    this.logger.log(`✓ published to '${pattern}'`);
  }

  /** Request-response RPC */
  async send<T = any, R = any>(pattern: string, data: T): Promise<R> {
    this.logger.log(`→ rpc '${pattern}' with payload ${JSON.stringify(data)}`);
    const response = await firstValueFrom(this.client.send<R, T>(pattern, data));
    this.logger.log(`✓ got RPC response from '${pattern}'`);
    return response;
  }
}
