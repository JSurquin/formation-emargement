-- CreateTable
CREATE TABLE "AppMeta" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "organizationName" TEXT NOT NULL DEFAULT '',
    "noteSnippets" JSONB NOT NULL DEFAULT '[]',
    "sessionTemplates" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "studentIds" JSONB NOT NULL,
    "notes" TEXT,
    "tags" JSONB,
    "favorited" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "trainer" TEXT,
    "createdAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "attendance" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);
