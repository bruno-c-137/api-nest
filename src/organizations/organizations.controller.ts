import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  async create(@Body() data: { name: string; slug: string }) {
    return this.organizationsService.create(data);
  }

  @Get()
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.organizationsService.findAll({ page: page || 1, limit: limit || 10 });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: { name?: string; slug?: string }) {
    return this.organizationsService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    return this.organizationsService.getMembers(id);
  }

  @Get(':id/usage')
  async getUsage(@Param('id') id: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.organizationsService.getUsage(id, { startDate, endDate });
  }
}
