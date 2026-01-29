import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  async create(
    @Body()
    data: {
      name: string;
      displayName: string;
      description?: string;
      price: number;
      billingInterval: string;
      maxConversationsPerDay?: number;
      maxMinutesPerMonth?: number;
      features?: string[];
    },
  ) {
    return this.plansService.create(data);
  }

  @Get()
  async findAll() {
    return this.plansService.findAll();
  }

  @Get('active')
  async findActive() {
    return this.plansService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.plansService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}
