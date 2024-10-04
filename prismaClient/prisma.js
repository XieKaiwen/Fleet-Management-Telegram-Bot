import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

prismaClient.$extends({
  name: "Retrieve vehicle with VOR reasons",
  model: {
    vehicles: {
      async getVORVehiclesWithReasons() {
        return await prismaClient.vehicles.findMany({
          include: {
            vehicle_vor_reason: {
              select: {
                vor_reason: true,
                date_reported: true,
              },
            },
          },
          orderBy: {
            vec_num: "asc",
          },
          where: {
            isvor: true,
          },
        });
      },
    },
  },
});

prismaClient.$extends({
    name: "Retrieve vehicle with VOR reasons",
    model: {
      vehicles: {
        async getVORVehicles() {
          return await prisma.vehicles.findMany({
            select: {
              vec_num: true,
              type: true,
            },
            orderBy: {
              vec_num: "asc",
            },
            where: {
              isvor: true,
            },
          });
        },
      },
    },
  });

prismaClient.$extends({
  name: "Retrieve chargers with VOR reasons",
  model: {
    vehicles: {
      async getVORChargersWithReasons() {
        return await prisma.chargers.findMany({
          include: {
            charger_vor_reason: {
              select: {
                vor_reason: true,
                date_reported: true,
              },
            },
          },
          orderBy: {
            charger_num: "asc",
          },
          where: {
            isvor: true,
          },
        });
      },
    },
  },
});

prismaClient.$extends({
    name: "Retrieve undriven SVC vehicles",
    model: {
      vehicles: {
        async getSVCVehiclesNotDriven() {
          return await prisma.vehicles.findMany({
            where: {
              isvor: false,
              driven: false,
            },
            select: {
              vec_num: true,
              type: true,
            },
            orderBy: {
              vec_num: "asc",
            },
          });
        },
      },
    },
  });

export default prismaClient;
