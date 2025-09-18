-- CreateTable
CREATE TABLE "post_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "optimizedData" BLOB NOT NULL,
    "smallData" BLOB,
    "mediumData" BLOB,
    "largeData" BLOB,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "placeholder" TEXT,
    "responsive" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "post_images_postId_key" ON "post_images"("postId");
