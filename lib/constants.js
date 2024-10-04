import prisma from "../prismaClient/prisma.js";

const vehicle_count = {
  GPT: {
    required: 2,
    total: 8,
  },
  ESL: {
    required: 4,
    total: 12,
  },
  "EFL CAT A": {
    required: 1,
    total: 4,
  },
  "EFL CAT C": {
    required: 3,
    total: 4,
  },
  "2.5 TON DFL": {
    required: 2,
    total: 6,
  },
  "5 TON DFL": {
    required: 0,
    total: 2,
  },
  MOFFET: {
    required: 2,
    total: 4,
  },
  MVLP: {
    required: 0,
    total: 4,
  },
  "ESL CHARGER": {
    required: 8,
    total: 16,
  },
  "EFL CHARGER": {
    required: 4,
    total: 9,
  },
};

const vehicleTypes = (
  await prisma.vehicles.findMany({
    distinct: ["type"],
    select: {
      type: true,
    },
  })
).map((item) => item.type);

const chargerTypes = (
  await prisma.chargers.findMany({
    distinct: ["type"],
    select: {
      type: true,
    },
  })
).map((item) => item.type);
console.log(chargerTypes);


export const defParams = {
    prisma,
    vehicle_count,
    chargerTypes,
    vehicleTypes,
  };