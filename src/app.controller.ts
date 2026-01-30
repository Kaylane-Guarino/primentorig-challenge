import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check application health status' })
  @ApiResponse({
    status: 200,
    description: 'Application and database are working correctly',
  })
  @ApiResponse({
    status: 503,
    description: 'One or more services are unavailable',
  })
  async checkHealth(@Res() res: Response) {
    const health = await this.appService.checkHealth();
    const statusCode =
      health.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return res.status(statusCode).json(health);
  }
}
