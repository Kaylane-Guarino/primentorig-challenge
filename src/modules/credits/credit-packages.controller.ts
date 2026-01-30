import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { CreditPackage } from './entities/credit-package.entity';

@ApiTags('Credits')
@Controller()
export class CreditPackagesController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('credit-packages')
  @ApiOperation({ summary: 'List all active credit packages' })
  @ApiResponse({ status: 200, description: 'List of packages', type: [CreditPackage] })
  async getPackages(): Promise<CreditPackage[]> {
    return this.creditsService.findAllActivePackages();
  }
}
