import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { StartConversationDto } from './dto/start-conversation.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  /**
   * Inicia uma nova conversa com avatar Tavus
   * POST /conversations/start
   */
  @Post('start')
  async startConversation(@Body() dto: StartConversationDto) {
    return this.conversationsService.startConversation({
      language: dto.language,
      personaId: dto.personaId,
      replicaId: dto.replicaId,
    });
  }

  @Post()
  async create(@Body() data: { userId: string; language: string; tavusReplicaId?: string }) {
    return this.conversationsService.create(data);
  }

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.conversationsService.findAll({ userId, status, page: page || 1, limit: limit || 10 });
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
}
