-- CreateTable
CREATE TABLE "JournalArticle" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "content" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalArticle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JournalArticle_slug_key" ON "JournalArticle"("slug");

-- CreateIndex
CREATE INDEX "JournalArticle_published_featured_idx" ON "JournalArticle"("published", "featured");

-- CreateIndex
CREATE INDEX "JournalArticle_publishedAt_idx" ON "JournalArticle"("publishedAt");
