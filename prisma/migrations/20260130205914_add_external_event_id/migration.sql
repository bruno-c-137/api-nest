/*
  Warnings:

  - A unique constraint covering the columns `[conversationId,externalEventId]` on the table `messages` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "externalEventId" TEXT;

-- CreateIndex
CREATE INDEX "messages_externalEventId_idx" ON "messages"("externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "messages_conversationId_externalEventId_key" ON "messages"("conversationId", "externalEventId");
