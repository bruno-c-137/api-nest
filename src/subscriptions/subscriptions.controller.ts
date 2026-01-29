import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  async create(
    @Body()
    data: {
      organizationId: string;
      planId: string;
      currentPeriodStart: string;
      currentPeriodEnd: string;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
    },
  ) {
    return this.subscriptionsService.create(data);
  }

  @Get('organization/:organizationId')
  async findByOrganization(@Param('organizationId') organizationId: string) {
    return this.subscriptionsService.findByOrganization(organizationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: { planId?: string; status?: string }) {
    return this.subscriptionsService.update(id, data);
  }

  @Put(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.subscriptionsService.cancel(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}
