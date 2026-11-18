-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'STREAMING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "VideoGenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'COMPLETED',
    "content" TEXT NOT NULL,
    "model" TEXT,
    "provider" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoGeneration" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google-vertex-ai',
    "model" TEXT NOT NULL,
    "status" "VideoGenerationStatus" NOT NULL DEFAULT 'PENDING',
    "providerJobId" TEXT,
    "outputUrl" TEXT,
    "outputGcsUri" TEXT,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "aspectRatio" TEXT,
    "durationSeconds" INTEGER,
    "resolution" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "VideoGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_userId_updatedAt_idx" ON "Conversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Conversation_projectId_idx" ON "Conversation"("projectId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoGeneration_userId_createdAt_idx" ON "VideoGeneration"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoGeneration_projectId_idx" ON "VideoGeneration"("projectId");

-- CreateIndex
CREATE INDEX "VideoGeneration_status_updatedAt_idx" ON "VideoGeneration"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "VideoGeneration_providerJobId_idx" ON "VideoGeneration"("providerJobId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoGeneration" ADD CONSTRAINT "VideoGeneration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoGeneration" ADD CONSTRAINT "VideoGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
