import { PrismaClient } from '@prisma/client'
import { format } from 'date-fns';
import { getAllData } from './lib/utils/retrieveDataUtils.js';

const prisma = new PrismaClient()

async function main() {
  // ... you will write your Prisma Client queries here
  // console.log("Retrieving the data...");
  // const vehiclesWithVorReasons = await prisma.vehicles.findMany({
  //   include: {
  //     vehicle_vor_reason: {
  //       select: {
  //         vor_reason: true,
  //         date_reported: true,
  //       },
  //     },
  //   },
  // });
  
  // const formattedVehicles = vehiclesWithVorReasons.map(vehicle => {
  //   return {
  //     ...vehicle,
  //     vehicle_vor_reason: vehicle.vehicle_vor_reason.map(vorReason => {
  //       return {
  //         ...vorReason,
  //         date_reported: vorReason.date_reported
  //           ? format(new Date(vorReason.date_reported), 'dd-MM-yyyy')
  //           : null,
  //       };
  //     }),
  //   };
  // });
  // console.log(JSON.stringify(formattedVehicles, null, 2));

  const data = await getAllData()
  console.log(data);
  
}

main()
  .then(async () => {
    console.log("Disconnecting prisma");
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })