-- CreateTable
CREATE TABLE "divisions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_enrollments" (
    "id" TEXT NOT NULL,
    "userDataId" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "face_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "userDataId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "method" TEXT NOT NULL DEFAULT 'face',
    "inLatitude" DOUBLE PRECISION,
    "inLongitude" DOUBLE PRECISION,
    "inAccuracy" DOUBLE PRECISION,
    "outLatitude" DOUBLE PRECISION,
    "outLongitude" DOUBLE PRECISION,
    "outAccuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_correction_requests" (
    "id" TEXT NOT NULL,
    "userDataId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "originalCheckInAt" TIMESTAMP(3),
    "originalCheckOutAt" TIMESTAMP(3),
    "requestedCheckInAt" TIMESTAMP(3) NOT NULL,
    "requestedCheckOutAt" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewerId" TEXT,
    "responseNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_correction_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "userDataId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewerId" TEXT,
    "responseNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "user_data" ADD COLUMN "divisionId" TEXT;

-- AlterTable
ALTER TABLE "branches" ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION,
ADD COLUMN "radiusMeters" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "divisions_clientId_name_key" ON "divisions"("clientId", "name");
CREATE INDEX "divisions_clientId_idx" ON "divisions"("clientId");
CREATE UNIQUE INDEX "face_enrollments_userDataId_key" ON "face_enrollments"("userDataId");
CREATE UNIQUE INDEX "attendance_records_userDataId_workDate_key" ON "attendance_records"("userDataId", "workDate");
CREATE INDEX "attendance_records_clientId_workDate_idx" ON "attendance_records"("clientId", "workDate");
CREATE INDEX "attendance_correction_requests_clientId_status_idx" ON "attendance_correction_requests"("clientId", "status");
CREATE INDEX "leave_requests_clientId_status_idx" ON "leave_requests"("clientId", "status");
CREATE INDEX "user_data_divisionId_idx" ON "user_data"("divisionId");

-- AddForeignKey
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_data" ADD CONSTRAINT "user_data_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "face_enrollments" ADD CONSTRAINT "face_enrollments_userDataId_fkey" FOREIGN KEY ("userDataId") REFERENCES "user_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_userDataId_fkey" FOREIGN KEY ("userDataId") REFERENCES "user_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance_correction_requests" ADD CONSTRAINT "attendance_correction_requests_userDataId_fkey" FOREIGN KEY ("userDataId") REFERENCES "user_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "attendance_correction_requests" ADD CONSTRAINT "attendance_correction_requests_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user_data"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_userDataId_fkey" FOREIGN KEY ("userDataId") REFERENCES "user_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "user_data"("id") ON DELETE SET NULL ON UPDATE CASCADE;
