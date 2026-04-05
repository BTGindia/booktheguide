-- CreateTable
CREATE TABLE "InspirationContent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "embedUrl" TEXT,
    "thumbnail" TEXT,
    "excerpt" TEXT,
    "tags" TEXT[],
    "destinations" TEXT[],
    "activityTypes" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspirationContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiQueryLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "clickedPackageId" TEXT,
    "responseTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiQueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InspirationContent_slug_key" ON "InspirationContent"("slug");

-- CreateIndex
CREATE INDEX "InspirationContent_slug_idx" ON "InspirationContent"("slug");

-- CreateIndex
CREATE INDEX "InspirationContent_type_idx" ON "InspirationContent"("type");

-- CreateIndex
CREATE INDEX "InspirationContent_isPublished_idx" ON "InspirationContent"("isPublished");

-- CreateIndex
CREATE INDEX "InspirationContent_createdAt_idx" ON "InspirationContent"("createdAt");

-- CreateIndex
CREATE INDEX "AiQueryLog_userId_idx" ON "AiQueryLog"("userId");

-- CreateIndex
CREATE INDEX "AiQueryLog_sessionId_idx" ON "AiQueryLog"("sessionId");

-- CreateIndex
CREATE INDEX "AiQueryLog_createdAt_idx" ON "AiQueryLog"("createdAt");

-- AddForeignKey
ALTER TABLE "InspirationContent" ADD CONSTRAINT "InspirationContent_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiQueryLog" ADD CONSTRAINT "AiQueryLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiQueryLog" ADD CONSTRAINT "AiQueryLog_clickedPackageId_fkey" FOREIGN KEY ("clickedPackageId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
