import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { TavusModule } from './tavus/tavus.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ConversationsModule,
    MessagesModule,
    TavusModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
