import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Vehicles data with isvor set to false
  const vehicles = [
    { vec_num: "46083", isvor: false, driven: false, type: "GPT" },
    { vec_num: "46084", isvor: false, driven: false, type: "GPT" },
    { vec_num: "46086", isvor: false, driven: false, type: "GPT" },
    { vec_num: "46087", isvor: false, driven: false, type: "GPT" },
    { vec_num: "46088", isvor: false, driven: false, type: "GPT" },
    { vec_num: "46089", isvor: false, driven: false, type: "GPT" },
    { vec_num: "46091", isvor: false, driven: false, type: "GPT" },
    { vec_num: "46092", isvor: false, driven: false, type: "GPT" },
    { vec_num: "50701", isvor: false, driven: false, type: "ESL" },
    { vec_num: "50702", isvor: false, driven: false, type: "ESL" },
    { vec_num: "50703", isvor: false, driven: false, type: "ESL" },
    { vec_num: "50704", isvor: false, driven: false, type: "ESL" },
    { vec_num: "50705", isvor: false, driven: false, type: "ESL" },
    { vec_num: "50706", isvor: false, driven: false, type: "ESL" },
    { vec_num: "50707", isvor: false, driven: false, type: "ESL" },
    { vec_num: "50708", isvor: false, driven: false, type: "ESL" },
    { vec_num: "50709", isvor: false, driven: false, type: "ESL" },
    { vec_num: "50710", isvor: false, driven: false, type: "ESL" },
    { vec_num: "50711", isvor: false, driven: false, type: "ESL" },
    { vec_num: "50712", isvor: false, driven: false, type: "ESL" },
    { vec_num: "50997", isvor: false, driven: false, type: "EFL CAT A" },
    { vec_num: "50998", isvor: false, driven: false, type: "EFL CAT A" },
    { vec_num: "50999", isvor: false, driven: false, type: "EFL CAT A" },
    { vec_num: "51000", isvor: false, driven: false, type: "EFL CAT A" },
    { vec_num: "51001", isvor: false, driven: false, type: "EFL CAT C" },
    { vec_num: "51002", isvor: false, driven: false, type: "EFL CAT C" },
    { vec_num: "51003", isvor: false, driven: false, type: "EFL CAT C" },
    { vec_num: "51004", isvor: false, driven: false, type: "EFL CAT C" },
    { vec_num: "51005", isvor: false, driven: false, type: "2.5 TON DFL" },
    { vec_num: "51006", isvor: false, driven: false, type: "2.5 TON DFL" },
    { vec_num: "51007", isvor: false, driven: false, type: "2.5 TON DFL" },
    { vec_num: "51008", isvor: false, driven: false, type: "2.5 TON DFL" },
    { vec_num: "51009", isvor: false, driven: false, type: "2.5 TON DFL" },
    { vec_num: "51010", isvor: false, driven: false, type: "2.5 TON DFL" },
    { vec_num: "51011", isvor: false, driven: false, type: "5 TON DFL" },
    { vec_num: "51012", isvor: false, driven: false, type: "5 TON DFL" },
    { vec_num: "51090", isvor: false, driven: false, type: "MOFFETT" },
    { vec_num: "51091", isvor: false, driven: false, type: "MOFFETT" },
    { vec_num: "51092", isvor: false, driven: false, type: "MOFFETT" },
    { vec_num: "51093", isvor: false, driven: false, type: "MOFFETT" },
    { vec_num: "51086", isvor: false, driven: false, type: "MVLP" },
    { vec_num: "51087", isvor: false, driven: false, type: "MVLP" },
    { vec_num: "51088", isvor: false, driven: false, type: "MVLP" },
    { vec_num: "51089", isvor: false, driven: false, type: "MVLP" },
  ];

  // Chargers data with isvor set to false
  const chargers = [
    {
      charger_num: "645-2005L",
      charger_loc: "C1CP",
      isvor: false,
      type: "ESL CHARGER",
    },
    {
      charger_num: "737-2005A",
      charger_loc: "C1CP",
      isvor: false,
      type: "ESL CHARGER",
    },
    {
      charger_num: "639-2005L",
      charger_loc: "C2CP",
      isvor: false,
      type: "ESL CHARGER",
    },
    {
      charger_num: "647-2005L",
      charger_loc: "C2CP",
      isvor: false,
      type: "ESL CHARGER",
    },
    {
      charger_num: "644-2005L",
      charger_loc: "C2CP",
      isvor: false,
      type: "ESL CHARGER",
    },
    {
      charger_num: "502-2007B",
      charger_loc: "C3CP",
      isvor: false,
      type: "ESL CHARGER",
    },
    {
      charger_num: "504-2007B",
      charger_loc: "C3CP",
      isvor: false,
      type: "ESL CHARGER",
    },
    {
      charger_num: "503-2007B",
      charger_loc: "C3CP",
      isvor: false,
      type: "ESL CHARGER",
    },
    {
      charger_num: "505-2007B",
      charger_loc: "C3CP",
      isvor: false,
      type: "ESL CHARGER",
    },
    {
      charger_num: "641-2005L",
      charger_loc: "C4PE",
      isvor: false,
      type: "ESL CHARGER",
    },
    {
      charger_num: "646-2005L",
      charger_loc: "C4PE",
      isvor: false,
      type: "ESL CHARGER",
    },
    {
      charger_num: "642-2005L",
      charger_loc: "C4CP",
      isvor: false,
      type: "ESL CHARGER",
    },
    {
      charger_num: "638-2005L",
      charger_loc: "C4CP",
      isvor: false,
      type: "ESL CHARGER",
    },
    {
      charger_num: "640-2005A",
      charger_loc: "C4CP",
      isvor: false,
      type: "ESL CHARGER",
    },
    {
      charger_num: "736-2005A",
      charger_loc: "C4CP",
      isvor: false,
      type: "ESL CHARGER",
    },
    {
      charger_num: "70801",
      charger_loc: "C1CP",
      isvor: false,
      type: "EFL CHARGER",
    },
    {
      charger_num: "70906",
      charger_loc: "C1CP",
      isvor: false,
      type: "EFL CHARGER",
    },
    {
      charger_num: "70810",
      charger_loc: "C2CP",
      isvor: false,
      type: "EFL CHARGER",
    },
    {
      charger_num: "70704",
      charger_loc: "C4PE",
      isvor: false,
      type: "EFL CHARGER",
    },
    {
      charger_num: "70809",
      charger_loc: "C3CP",
      isvor: false,
      type: "EFL CHARGER",
    },
    {
      charger_num: "70807",
      charger_loc: "C3CP",
      isvor: false,
      type: "EFL CHARGER",
    },
    {
      charger_num: "70501",
      charger_loc: "C2CP",
      isvor: false,
      type: "EFL CHARGER",
    },
    {
      charger_num: "70808",
      charger_loc: "C4CP",
      isvor: false,
      type: "EFL CHARGER",
    },
    {
      charger_num: "70802",
      charger_loc: "C4CP",
      isvor: false,
      type: "EFL CHARGER",
    },
  ];

  // Seeding vehicles
  for (const vehicle of vehicles) {
    await prisma.vehicles.upsert({
      where: { vec_num: vehicle.vec_num },
      update: vehicle,
      create: vehicle,
    });
  }

  // Seeding chargers
  for (const charger of chargers) {
    await prisma.chargers.upsert({
      where: { charger_num: charger.charger_num },
      update: charger,
      create: charger,
    });
  }
  console.log("Data successfully seeded!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
