import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async create(
    @Body()
    data: {
      conversationId: string;
      userId?: string;
      role: string;
      content: string;
      transcription?: string;
    },
  ) {
    return this.messagesService.create(data);
  }

  @Get('conversation/:conversationId')
  async findByConversation(@Param('conversationId') conversationId: string) {
    return this.messagesService.findByConversation(conversationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.messagesService.remove(id);
  }
}
