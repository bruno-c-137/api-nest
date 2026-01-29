import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  async create(@Body() data: { organizationId: string; tavusReplicaId?: string; metadata?: any }) {
    return this.conversationsService.create(data);
  }

  @Get()
  async findAll(
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.conversationsService.findAll({ organizationId, status, page: page || 1, limit: limit || 10 });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Put(':id/start')
  async start(@Param('id') id: string, @Body() data: { tavusSessionId: string }) {
    return this.conversationsService.start(id, data.tavusSessionId);
  }

  @Put(':id/end')
  async end(@Param('id') id: string) {
    return this.conversationsService.end(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.conversationsService.remove(id);
  }

  @Get(':id/messages')
  async getMessages(@Param('id') id: string) {
    return this.conversationsService.getMessages(id);
  }

  @Get(':id/events')
  async getEvents(@Param('id') id: string, @Query('eventType') eventType?: string) {
    return this.conversationsService.getEvents(id, eventType);
  }
}
