-- AlterTable
ALTER TABLE "LoanApplication" ADD COLUMN     "productSnapshot" JSONB;

-- AlterTable
ALTER TABLE "MiningSubscription" ADD COLUMN     "planSnapshot" JSONB;

-- AlterTable
ALTER TABLE "LearnContent" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "summary" TEXT;

-- CreateTable
CREATE TABLE "MarketKline" (
    "id" TEXT NOT NULL,
    "pairId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "openTime" TIMESTAMP(3) NOT NULL,
    "closeTime" TIMESTAMP(3),
    "open" DECIMAL(38,18) NOT NULL,
    "high" DECIMAL(38,18) NOT NULL,
    "low" DECIMAL(38,18) NOT NULL,
    "close" DECIMAL(38,18) NOT NULL,
    "volume" DECIMAL(38,18),
    "provider" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketKline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "ledgerCorrelationId" TEXT NOT NULL,
    "ledgerPostingId" TEXT,
    "asset" TEXT,
    "amount" DECIMAL(38,18),
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnArticleRevision" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "attachments" JSONB,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearnArticleRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnTag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnArticleTag" (
    "articleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "LearnArticleTag_pkey" PRIMARY KEY ("articleId","tagId")
);

-- CreateTable
CREATE TABLE "LearnMediaAsset" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "revisionId" TEXT,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "provider" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearnMediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketKline_symbol_interval_openTime_idx" ON "MarketKline"("symbol", "interval", "openTime");

-- CreateIndex
CREATE INDEX "MarketKline_receivedAt_idx" ON "MarketKline"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketKline_pairId_interval_openTime_key" ON "MarketKline"("pairId", "interval", "openTime");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_idempotencyKey_key" ON "Activity"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Activity_userId_createdAt_idx" ON "Activity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_userId_type_createdAt_idx" ON "Activity"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_referenceType_referenceId_idx" ON "Activity"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "Activity_ledgerCorrelationId_idx" ON "Activity"("ledgerCorrelationId");

-- CreateIndex
CREATE UNIQUE INDEX "LearnCategory_slug_key" ON "LearnCategory"("slug");

-- CreateIndex
CREATE INDEX "LearnArticleRevision_articleId_createdAt_idx" ON "LearnArticleRevision"("articleId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearnArticleRevision_articleId_revision_key" ON "LearnArticleRevision"("articleId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "LearnTag_slug_key" ON "LearnTag"("slug");

-- CreateIndex
CREATE INDEX "LearnArticleTag_tagId_idx" ON "LearnArticleTag"("tagId");

-- CreateIndex
CREATE INDEX "LearnMediaAsset_articleId_createdAt_idx" ON "LearnMediaAsset"("articleId", "createdAt");

-- CreateIndex
CREATE INDEX "LearnMediaAsset_revisionId_createdAt_idx" ON "LearnMediaAsset"("revisionId", "createdAt");

-- CreateIndex
CREATE INDEX "LearnContent_categoryId_status_idx" ON "LearnContent"("categoryId", "status");

-- AddForeignKey
ALTER TABLE "MarketKline" ADD CONSTRAINT "MarketKline_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "MarketPair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnContent" ADD CONSTRAINT "LearnContent_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LearnCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnArticleRevision" ADD CONSTRAINT "LearnArticleRevision_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "LearnContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnArticleTag" ADD CONSTRAINT "LearnArticleTag_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "LearnContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnArticleTag" ADD CONSTRAINT "LearnArticleTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "LearnTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnMediaAsset" ADD CONSTRAINT "LearnMediaAsset_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "LearnContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnMediaAsset" ADD CONSTRAINT "LearnMediaAsset_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "LearnArticleRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
