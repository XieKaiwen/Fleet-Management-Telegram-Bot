-- CreateTable
CREATE TABLE "charger_vor_reason" (
    "id" SERIAL NOT NULL,
    "charger_id" INTEGER,
    "date_reported" DATE,
    "vor_reason" TEXT NOT NULL,

    CONSTRAINT "charger_vor_reason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chargers" (
    "id" SERIAL NOT NULL,
    "charger_num" TEXT NOT NULL,
    "charger_loc" TEXT NOT NULL,
    "isvor" BOOLEAN NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "chargers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_vor_reason" (
    "id" SERIAL NOT NULL,
    "vec_id" INTEGER,
    "date_reported" DATE,
    "vor_reason" TEXT NOT NULL,

    CONSTRAINT "vehicle_vor_reason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "vec_num" TEXT NOT NULL,
    "isvor" BOOLEAN NOT NULL,
    "driven" BOOLEAN NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unique_charger_num" ON "chargers"("charger_num");

-- CreateIndex
CREATE UNIQUE INDEX "unique_vec_num" ON "vehicles"("vec_num");

-- AddForeignKey
ALTER TABLE "charger_vor_reason" ADD CONSTRAINT "charger_vor_reason_charger_id_fkey" FOREIGN KEY ("charger_id") REFERENCES "chargers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicle_vor_reason" ADD CONSTRAINT "vehicle_vor_reason_vec_id_fkey" FOREIGN KEY ("vec_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

