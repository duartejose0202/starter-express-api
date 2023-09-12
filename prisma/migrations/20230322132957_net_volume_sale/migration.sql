-- CreateTable
CREATE TABLE "NetVolumeSales" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "net_volume" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "NetVolumeSales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NetVolumeSales_date_key" ON "NetVolumeSales"("date");
