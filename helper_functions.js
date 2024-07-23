import { format } from "date-fns";

export function getCurrentDateInSingapore() {
  // Create a new Date object
  const now = new Date();

  // Create an Intl.DateTimeFormat object with Singapore timezone
  const options = {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const formatter = new Intl.DateTimeFormat("en-GB", options);

  // Format the date
  const parts = formatter.formatToParts(now);
  const day = parts.find((part) => part.type === "day").value;
  const month = parts.find((part) => part.type === "month").value;
  const year = parts.find((part) => part.type === "year").value;

  // Return the formatted date as DD-MM-YYYY
  return `${day}-${month}-${year}`;
}

export async function sendServState(
  bot,
  prisma,
  ctx,
  vehicle_count,
  chargerTypes,
  vehicleTypes
) {
  try {
    const vehiclesWithVorReasons = await prisma.vehicles.findMany({
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

    const vehiclesWithVorReasonsFormattedDate = vehiclesWithVorReasons.map(
      (vehicle) => {
        return {
          ...vehicle,
          vehicle_vor_reason: vehicle.vehicle_vor_reason.map((vorReason) => {
            return {
              ...vorReason,
              date_reported: vorReason.date_reported
                ? format(new Date(vorReason.date_reported), "dd-MM-yyyy")
                : null,
            };
          }),
        };
      }
    );

    const VORvehicleDataGroupedByType = {};
    vehicleTypes.forEach((type) => {
      const filteredVehicles = vehiclesWithVorReasonsFormattedDate.filter(
        (vehicle) => {
          return vehicle.type === type;
        }
      );
      VORvehicleDataGroupedByType[type] = filteredVehicles;
    });

    // console.log(JSON.stringify(VORvehicleDataGroupedByType, null, 2));
    const currentDate = getCurrentDateInSingapore();
    let serv_state_msg = `SERV STATE OF FM VEH ${currentDate}`;

    for (const vehicleType in VORvehicleDataGroupedByType) {
      const VORvehiclesListByType = VORvehicleDataGroupedByType[vehicleType];

      const { total, required } = vehicle_count[vehicleType];
      serv_state_msg += `\n\n${vehicleType} (${
        total - VORvehiclesListByType.length
      }/${total}) [OPS REQUIREMENT: ${required}]\n`;

      VORvehiclesListByType.forEach((vec) => {
        const { vec_num, vehicle_vor_reason } = vec;
        const vorText = vehicle_vor_reason.map((vor_reason) => {
          return `${vor_reason.vor_reason} ${
            vor_reason.date_reported ? `(${vor_reason.date_reported})` : ""
          }`;
        });
        const joinedVORText = vorText.join(" ");
        serv_state_msg += `\n${vec_num}(VOR) - ${joinedVORText}`;
      });
      serv_state_msg += "\n_________";
    }

    try {
      const chargersWithVORReasons = await prisma.chargers.findMany({
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

      const chargersWithVORReasonsFormattedDate = chargersWithVORReasons.map(
        (charger) => {
          return {
            ...charger,
            charger_vor_reason: charger.charger_vor_reason.map((vorReason) => {
              return {
                ...vorReason,
                date_reported: vorReason.date_reported
                  ? format(new Date(vorReason.date_reported), "dd-MM-yyyy")
                  : null,
              };
            }),
          };
        }
      );

      const VORchargerGroupedByType = {};
      chargerTypes.forEach((type) => {
        const filteredChargers = chargersWithVORReasonsFormattedDate.filter(
          (charger) => {
            return charger.type === type;
          }
        );
        VORchargerGroupedByType[type] = filteredChargers;
      });

      for (const chargerType in VORchargerGroupedByType) {
        const VORchargerListByType = VORchargerGroupedByType[chargerType];

        const { total, required } = vehicle_count[chargerType];
        serv_state_msg += `\n\n${chargerType} (${
          total - VORchargerListByType.length
        }/${total}) [OPS REQUIREMENT: ${required}]\n`;

        VORchargerListByType.forEach((charger) => {
          const { charger_num, charger_loc, charger_vor_reason } = charger;
          const vorText = charger_vor_reason.map((vor_reason) => {
            return `${vor_reason.vor_reason} ${
              vor_reason.date_reported ? `(${vor_reason.date_reported})` : ""
            }`;
          });
          const joinedVORText = vorText.join(" ");
          serv_state_msg += `\n${charger_num}(VOR) / ${charger_loc} - ${joinedVORText}`;
        });
        serv_state_msg += "\n_________";
      }

      return bot.telegram.sendMessage(ctx.chat.id, serv_state_msg);
    } catch (error) {
      console.error(error);
      return bot.telegram.sendMessage(
        ctx.chat.id,
        "An error has occurred on the server trying to retrieve information on VOR chargers. Please contact 96305601 regarding this to fix this issue,"
      );
    }
  } catch (error) {
      return bot.telegram.sendMessage(
      ctx.chat.id,
      "An error has occurred on the server trying to retrieve information on VOR vehicles. Please contact 96305601 regarding this to fix this issue,"
    );
  }
}

export async function sendWPT(
  bot,
  prisma,
  ctx,
  vehicle_count,
  chargerTypes,
  vehicleTypes
) {
  try {
    const notDrivenVehicles = await prisma.vehicles.findMany({
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

    const currentDate = getCurrentDateInSingapore();

    let WPTMessage = `MHE & OPS Keypress Check: Done (${currentDate})\n\nLogbook Check: Done (${currentDate})\n\nPlatforms yet to be used this week:\n`;

    const notDrivenVehiclesGroupedByType = {};
    vehicleTypes.forEach((type) => {
      const filteredVehicles = notDrivenVehicles.filter((vec) => {
        return type === vec.type;
      });
      notDrivenVehiclesGroupedByType[type] = filteredVehicles;
    });
    // console.log(notDrivenVehiclesGroupedByType);

    for (const vehicleType in notDrivenVehiclesGroupedByType) {
      if (notDrivenVehiclesGroupedByType[vehicleType].length > 0) {
        const vehicleList = notDrivenVehiclesGroupedByType[vehicleType].map(
          (vec) => {
            return vec.vec_num;
          }
        );
        const vehicleListString = vehicleList.join(", ");
        WPTMessage += `\n${vehicleType}: ${vehicleListString}\n`;
      } else {
        WPTMessage += `\n${vehicleType}: NIL\n`;
      }
    }

    try {
      const VORvehicles = await prisma.vehicles.findMany({
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

      const VORVehiclesGroupedByType = {};
      vehicleTypes.forEach((type) => {
        const filteredVehicles = VORvehicles.filter((vec) => {
          return type === vec.type;
        });
        VORVehiclesGroupedByType[type] = filteredVehicles;
      });

      WPTMessage += "\n==========U/S===========\n";

      for (const vehicleType in VORVehiclesGroupedByType) {
        if (VORVehiclesGroupedByType[vehicleType].length > 0) {
          const vehicleList = VORVehiclesGroupedByType[vehicleType].map(
            (vec) => {
              return vec.vec_num;
            }
          );
          const vehicleListString = vehicleList.join(", ");
          WPTMessage += `\n${vehicleType}: ${vehicleListString}\n`;
        } else {
          WPTMessage += `\n${vehicleType}: NIL\n`;
        }
      }

      bot.telegram.sendMessage(ctx.chat.id, WPTMessage);
    } catch (error) {
      console.error(error);
      return bot.telegram.sendMessage(
        ctx.chat.id,
        "Error occurred on server when retrieving VOR vehicles for WPT list."
      );
    }
  } catch (error) {
    console.error(error);
    return bot.telegram.sendMessage(
      ctx.chat.id,
      "Error retrieving vehicles that are not driven for WPT list. "
    );
  }
}

export async function botSendMessage(ctx, message){
  await ctx.reply(`@${ctx.from.username}\n${message}`);
}

export function restartCtx(ctx){
  ctx.session = {
    state: "idle",
    cur_command: null,
    cur_step: null,
    input: {},
  };
}