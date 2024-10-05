import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

const extendedPrismaClient =prismaClient.$extends({
  name: "Custom Prisma Extensions",
  model: {
    vehicles: {
      // Retrieve vehicles with VOR reasons
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

      // Retrieve vehicles marked as VOR (without reasons)
      async getVORVehicles() {
        return await prismaClient.vehicles.findMany({
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

      // Retrieve undriven SVC vehicles
      async getSVCVehiclesNotDriven() {
        return await prismaClient.vehicles.findMany({
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

      async updateDrivenVehicles(vehicles){
        await prismaClient.vehicles.updateMany({
          where: {
            vec_num: {
              in: vehicles,
            },
          },  
          data: {
            driven: true
          },
        })
      },

      async setAllVehiclesUndriven(){
        await prismaClient.vehicles.updateMany({
          data: {
            driven: false
          },
        })
      }
    },

    chargers: {
      // Retrieve chargers with VOR reasons
      async getVORChargersWithReasons() {
        return await prismaClient.chargers.findMany({
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

export default extendedPrismaClient;
