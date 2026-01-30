import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async checkHealth() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        status: 'down',
      },
    };

    try {
      await this.dataSource.query('SELECT 1');
      health.database.status = 'up';
    } catch (error) {
      health.status = 'error';
      health.database.status = 'down';
    }

    return health;
  }
}
