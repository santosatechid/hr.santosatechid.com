-- AlterTable
ALTER TABLE "branches" ADD COLUMN "bpjsWageFloor" INTEGER;

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalGross" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalNet" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "userDataId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "gross" DECIMAL(18,2) NOT NULL,
    "taxAllowance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "pph21" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "jkn" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "jht" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "jp" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netPay" DECIMAL(18,2) NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_clientId_period_key" ON "payroll_runs"("clientId", "period");
CREATE INDEX "payroll_runs_clientId_status_idx" ON "payroll_runs"("clientId", "status");
CREATE UNIQUE INDEX "payslips_runId_userDataId_key" ON "payslips"("runId", "userDataId");
CREATE INDEX "payslips_clientId_period_idx" ON "payslips"("clientId", "period");

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_runId_fkey" FOREIGN KEY ("runId") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_userDataId_fkey" FOREIGN KEY ("userDataId") REFERENCES "user_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
