import prisma from "../prismaClient/prisma.js";

export async function getAllVehicles() {
  const allVehicles = await prisma.vehicles.findMany();
  return allVehicles;
}

export async function getAllVORVehicles() {
  try {
    const allVORVehiclesWithReasons = await prisma.vehicles.findMany({
      where: {
        isvor: true,
      },
    });
    return allVORVehiclesWithReasons;
  } catch (error) {
    console.error(error);
  }
}

export async function getAllSVCVehicles() {
  const allSVCVehicles = await prisma.vehicles.findMany({
    where: {
      isvor: false,
    },
  });
  return allSVCVehicles;
}

export async function getAllChargers() {
  const allChargers = await prisma.chargers.findMany();
  return allChargers;
}

export async function getAllVORChargers() {
  const allVORChargersWithReasons = await prisma.chargers.findMany({
    where: {
      isvor: true,
    },
  });
  return allVORChargersWithReasons;
}

export async function getAllSVCChargers() {
  const allSVCChargers = await prisma.chargers.findMany({
    where: {
      isvor: false,
    },
  });
  return allSVCChargers;
}