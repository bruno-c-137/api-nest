import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PlansModule } from './plans/plans.module';

@Module({
  imports: [
    PrismaModule,
    OrganizationsModule,
    UsersModule,
    ConversationsModule,
    MessagesModule,
    SubscriptionsModule,
    PlansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
