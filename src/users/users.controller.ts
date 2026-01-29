import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() data: { email: string; name: string; password?: string }) {
    return this.usersService.create(data);
  }

  @Get()
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.findAll({ page: page || 1, limit: limit || 10 });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: { name?: string; avatarUrl?: string }) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get(':id/organizations')
  async getOrganizations(@Param('id') id: string) {
    return this.usersService.getOrganizations(id);
  }
}
