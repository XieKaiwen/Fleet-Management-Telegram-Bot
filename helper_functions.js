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
  { bot, prisma, vehicle_count, chargerTypes, vehicleTypes },
  ctx
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

    vehiclesWithVorReasons.forEach((vehicle) => {
      vehicle.vehicle_vor_reason.sort(
        (a, b) => new Date(a.date_reported) - new Date(b.date_reported)
      );
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

      return botSendMessage(ctx, serv_state_msg);
    } catch (error) {
      console.error(error);
      return botSendMessage(
        ctx,
        "An error has occurred on the server trying to retrieve information on VOR chargers. Please contact 96305601 regarding this to fix this issue,"
      );
    }
  } catch (error) {
    console.log("Error: ", error);
    return botSendMessage(
      ctx,
      "An error has occurred on the server trying to retrieve information on VOR vehicles. Please contact 96305601 regarding this to fix this issue,"
    );
  }
}

export async function sendWPT({ bot, prisma, vehicleTypes }, ctx) {
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

      return botSendMessage(ctx, WPTMessage);
    } catch (error) {
      console.error(error);
      return botSendMessage(
        ctx,
        "Error occurred on server when retrieving VOR vehicles for WPT list."
      );
    }
  } catch (error) {
    console.error(error);
    return botSendMessage(
      ctx,
      "Error retrieving vehicles that are not driven for WPT list. "
    );
  }
}

export async function botSendMessage(ctx, message) {
  await ctx.reply(`@${ctx.from.username}\n${message}`);
}

export function restartCtxSession(ctx) {
  // console.log(ctx.session.state);
  ctx.session.state = "idle";
  ctx.session.cur_command = null;
  ctx.session.cur_step = null;
  ctx.session.input = {};
}
export async function editServStateStep1(
  { bot, prisma, vehicle_count, chargerTypes, vehicleTypes },
  ctx,
  text
) {
  // console.log("REACHED HERE");
  // console.log("Text: ", text);
  switch (text) {
    case "1":
      // VOR to SVC
      await sendServState(
        { bot, prisma, vehicle_count, chargerTypes, vehicleTypes },
        ctx
      );

      await botSendMessage(
        ctx,
        "Please type the vehicles/chargers you wish to move from VOR to SVC in a list, each item should be separated by a comma\nExample: 46087, 46088, 51000"
      );
      ctx.session.input[ctx.session.cur_step] = text;
      ctx.session.cur_step++;
      break;

    case "2":
      // SVC to VOR
      await botSendMessage(
        ctx,
        "Please enter the vehicles/chargers you wish to move from SVC to VOR, including the VOR information. Each vehicle/charger and VOR information should go on a new line. Follow the format 'vehicle_number - VOR_reason - date_reported' \nExample:\nvehicle_1 - vor_reason - DD/MM/YYYY\nvehicle_2 - vor_reason - DD/MM/YYYY\nvehicle_3 - vor_reason - DD/MM/YYYY\nIf there are more than one VOR reasons found on two separate dates, they should be entered on separate lines. Format for date has to be followed STRICTLY."
      );
      ctx.session.input[ctx.session.cur_step] = text;
      ctx.session.cur_step++;
      break;

    case "3":
      // Updating VOR info
      await botSendMessage(
        ctx,
        "Enter the vehicle/charger you wish to update VOR information for, the new VOR information and the date reported. This command can only work for 1 vehicle or charger at a time. Remember to follow the date format STRICTLY\nExample: 46088, Found engine problem, 20-02-2024"
      );
      ctx.session.input[ctx.session.cur_step] = text;
      ctx.session.cur_step++;
      break;

    default:
      await botSendMessage(
        ctx,
        `${text} is not an appropriate input for the command, please enter an appropriate input.\n1 - Move vehicle/charger from VOR to SVC\n2 - Move vehicle/charger to VOR\n3 - Update VOR information of vehicle/charger`
      );
      break;
  }
}
export async function editServStateStep2(
  { bot, prisma, vehicle_count, chargerTypes, vehicleTypes },
  ctx,
  text
) {
  // Step 2. Users sending in the input for /edit_serv_state
  switch (ctx.session.input[1]) {
    case "1": {
      // Separate list of vehicles into an array and then move them to SVC using prisma
      const itemToSVCList = text.split(", ");
      console.log(itemToSVCList);
      // Check if all the vehicles are valid vehicles
      try {
        const fullVehicleList = await prisma.vehicles.findMany({
          select: {
            vec_num: true,
          },
        });
        const fullChargerList = await prisma.chargers.findMany({
          select: {
            charger_num: true,
          },
        });
        const fullVehicleAndChargerList = {
          vehicleNumbers: fullVehicleList.map((v) => v.vec_num),
          chargerNumbers: fullChargerList.map((c) => c.charger_num),
        };
        console.log(fullVehicleAndChargerList);
        try {
          // Checking if all the vehicles/charger numbers entered are valid. If not, throw an error
          let invalidItems = [];
          let vehicleNumToChange = [];
          let chargerNumToChange = [];
          itemToSVCList.forEach((item) => {
            if (
              !fullVehicleAndChargerList.vehicleNumbers.includes(item) &&
              !fullVehicleAndChargerList.chargerNumbers.includes(item)
            ) {
              // throw new Error(`${item} does not exist in the list of vehicles. Please make an edit and send the vehicle/charger list again to proceed with the command.`)
              invalidItems.push(item);
            } else {
              if (fullVehicleAndChargerList.vehicleNumbers.includes(item)) {
                vehicleNumToChange.push(item);
              } else {
                chargerNumToChange.push(item);
              }
            }
          });
          if (invalidItems.length > 0) {
            const joinedInvalidItems = invalidItems.join(", ");
            throw new Error(
              `${joinedInvalidItems} does not exist in the list of vehicles. Please edit and send the vehicle/charger list again to proceed with the command.`
            );
          } else {
            // Make the changes
            console.log("Vehicles to SVC: ", vehicleNumToChange);
            console.log("Chargers to SVC: ", chargerNumToChange);
            try {
              await prisma.$transaction([
                prisma.vehicles.updateMany({
                  where: {
                    vec_num: {
                      in: vehicleNumToChange,
                    },
                  },
                  data: { isvor: false },
                }),
                prisma.chargers.updateMany({
                  where: {
                    charger_num: {
                      in: chargerNumToChange,
                    },
                  },
                  data: { isvor: false },
                }),
                prisma.vehicle_vor_reason.deleteMany({
                  where: {
                    vehicles: {
                      isvor: false,
                    },
                  },
                }),
                prisma.charger_vor_reason.deleteMany({
                  where: {
                    chargers: {
                      isvor: false,
                    },
                  },
                }),
              ]);
              restartCtxSession(ctx);
              await botSendMessage(
                ctx,
                "Serv state successfully updated, command session ended! Here is the updated serv_state..."
              );
              return sendServState(
                { bot, prisma, vehicle_count, chargerTypes, vehicleTypes },
                ctx
              );
            } catch (error) {
              console.error("Error: ", error);
            }
          }
        } catch (error) {
          console.error("Error: ", error);
          return botSendMessage(ctx, error.message);
        }
      } catch (error) {
        console.log("Error: ", error);
      }
      break;
    }
    case "2":
      // for Option 2 to shift from SVC to VOR
      /* 
      Input should be of the form:
      vehicle_1 - vor_reason - date_reported (DD/MM/YYYY)
      vehicle_2 - vor_reason - date_reported
      vehicle_3 - vor_reason - date_reported
      
      The same vehicle can have different vor_reasons but with different date_reported
      Hence, remember to sort by vehicle_1 and then date_reported first
      */
      try {
        const fullVehicleList = await prisma.vehicles.findMany({
          select: {
            vec_num: true,
          },
        });
        const fullChargerList = await prisma.chargers.findMany({
          select: {
            charger_num: true,
          },
        });
        const fullVehicleAndChargerList = {
          vehicleNumbers: fullVehicleList.map((v) => v.vec_num),
          chargerNumbers: fullChargerList.map((c) => c.charger_num),
        };
        console.log(fullVehicleAndChargerList);
        try {
          const separatedLines = text.split("\n");
          console.log("Separated lines: ", separatedLines);
          const invalidLines = [];
          const itemsToUpdate = {
            vehicles: [],
            chargers: [],
          };
          separatedLines.forEach((line) => {
            const lineSplitted = line.split(" - ");
            // Checking if the lines written are correctly
            if (lineSplitted.length > 3) {
              invalidLines.push(line);
            } else if (lineSplitted.length < 3) {
              invalidLines.push(line);
            } else {
              // Use regex to check if the date is written correctly
              const [itemNumber, vorReason, dateReported] = lineSplitted;
              if (
                !/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/([0-9]{4})$/.test(
                  dateReported
                )
              ) {
                invalidLines.push(line);
              } else {
                // Check if the vehicles/chargers exists in the list
                if (
                  !fullVehicleAndChargerList.vehicleNumbers.includes(
                    itemNumber
                  ) &&
                  !fullVehicleAndChargerList.chargerNumbers.includes(itemNumber)
                ) {
                  invalidLines.push(line);
                } else {
                  // Add splitted line to the list to update if exists
                  if (
                    fullVehicleAndChargerList.vehicleNumbers.includes(
                      itemNumber
                    )
                  ) {
                    itemsToUpdate.vehicles.push(lineSplitted);
                  } else if (
                    fullVehicleAndChargerList.chargerNumbers.includes(
                      itemNumber
                    )
                  ) {
                    itemsToUpdate.chargers.push(lineSplitted);
                  }
                }
              }
            }
          });
          // Throw error if the there are invalid lines
          if (invalidLines.length > 0) {
            const invalidLinesJoined = invalidLines.join("\n");
            throw new Error(
              `The following lines are invalid, please check and edit appropriately\n${invalidLinesJoined}`
            );
          }
          // Sort the itemToUpdate list based on the sublists' dates
          console.log(
            "itemToUpdate vehicles before sort: ",
            itemsToUpdate.vehicles
          );
          // function parseDate(dateString){
          //   const [day, month, year] = dateString.split('/');
          //   return new Date(year, month - 1, day);
          // }
          // const sortedItemsToUpdate = {
          //   vehicles: itemsToUpdate.vehicles.sort((a,b) => {
          //     const dateA = parseDate(a[2]);
          //     const dateB = parseDate(b[2]);
          //     return dateA - dateB;
          //   }),
          //   chargers: itemsToUpdate.chargers.sort((a,b) => {
          //     const dateA = parseDate(a[2]);
          //     const dateB = parseDate(b[2]);
          //     return dateA - dateB;
          //   })
          // }
          // console.log("itemToUpdate vehicles after sort: ", sortedItemsToUpdate.vehicles);
          // combinedSortedItems should contain [v_num, reason, date]
          const combinedItemsToUpdate = {
            vehicles: {},
            chargers: {},
          };
          /* To contain {vecNum: [{reason:, date:}, {}, ],
                          vecNum_1:...
                        }*/
          itemsToUpdate.vehicles.forEach((item) => {
            const [num, reason, date] = item;
            if (!combinedItemsToUpdate.vehicles[num]) {
              combinedItemsToUpdate.vehicles[num] = [];
            }
            combinedItemsToUpdate.vehicles[num].push({
              reason: reason,
              date: date,
            });
          });
          itemsToUpdate.chargers.forEach((item) => {
            const [num, reason, date] = item;
            if (!combinedItemsToUpdate.chargers[num]) {
              combinedItemsToUpdate.chargers[num] = [];
            }
            combinedItemsToUpdate.chargers[num].push({
              reason: reason,
              date: date,
            });
          });
          console.log("Combined items: ", combinedItemsToUpdate);
          const combinedItemsToUpdateFormattedDate = {
            vehicles: {},
            chargers: {},
          };
          // Format date to put into database
          function convertDateFormat(dateString) {
            const [day, month, year] = dateString.split("/");
            return `${year}-${month}-${day}`;
          }
          if (Object.keys(combinedItemsToUpdate.vehicles).length > 0) {
            for (const vecNum in combinedItemsToUpdate.vehicles) {
              combinedItemsToUpdateFormattedDate.vehicles[vecNum] =
                combinedItemsToUpdate.vehicles[vecNum].map((item) => {
                  return {
                    ...item,
                    date: convertDateFormat(item.date),
                  };
                });
            }
          }
          if (Object.keys(combinedItemsToUpdate.chargers).length > 0) {
            for (const chargerNum in combinedItemsToUpdate.chargers) {
              combinedItemsToUpdateFormattedDate.chargers[chargerNum] =
                combinedItemsToUpdate.chargers[chargerNum].map((item) => {
                  return {
                    ...item,
                    date: convertDateFormat(item.date),
                  };
                });
            }
          }
          console.log(combinedItemsToUpdateFormattedDate);
          try {
            await prisma.$transaction(async (prisma) => {
              const vehicleReasonInserts = [];
              const chargerReasonInserts = [];

              const vecNums = Object.keys(
                combinedItemsToUpdateFormattedDate.vehicles
              );
              const chargerNums = Object.keys(
                combinedItemsToUpdateFormattedDate.chargers
              );
              // Prepare vehicle updates and inserts
              for (const vecNum in combinedItemsToUpdateFormattedDate.vehicles) {
                const vorReasons =
                  combinedItemsToUpdateFormattedDate.vehicles[vecNum];

                // Prepare vor reasons inserts
                for (const { reason, date } of vorReasons) {
                  vehicleReasonInserts.push(
                    prisma.vehicles
                      .findUnique({ where: { vec_num: vecNum } })
                      .then((vehicle) => {
                        if (vehicle) {
                          return prisma.vehicle_vor_reason.create({
                            data: {
                              vec_id: vehicle.id,
                              vor_reason: reason,
                              date_reported: new Date(date).toISOString(),
                            },
                          });
                        }
                      })
                  );
                }
              }

              // Prepare charger updates and inserts
              for (const chargerNum in combinedItemsToUpdateFormattedDate.chargers) {
                const vorReasons =
                  combinedItemsToUpdateFormattedDate.chargers[chargerNum];

                // Prepare vor reasons inserts
                for (const { reason, date } of vorReasons) {
                  chargerReasonInserts.push(
                    prisma.chargers
                      .findUnique({ where: { charger_num: chargerNum } })
                      .then((charger) => {
                        if (charger) {
                          return prisma.charger_vor_reason.create({
                            data: {
                              charger_id: charger.id,
                              vor_reason: reason,
                              date_reported: new Date(date).toISOString(),
                            },
                          });
                        }
                      })
                  );
                }
              }
              console.log("Vehicles to be Updated to VOR: ", vecNums);
              console.log("Chargers to be Updated to VOR: ", chargerNums);
              // Execute all operations in parallel within the transaction
              await Promise.all([
                prisma.vehicles.updateMany({
                  where: {
                    vec_num: {
                      in: vecNums,
                    },
                  },
                  data: {
                    isvor: true,
                  },
                }),
                prisma.chargers.updateMany({
                  where: {
                    charger_num: {
                      in: chargerNums,
                    },
                  },
                  data: {
                    isvor: true,
                  },
                }),
                ...vehicleReasonInserts,
                ...chargerReasonInserts,
              ]);
            });

            await botSendMessage(
              ctx,
              "Successfully updated vehicles/chargers to VOR and added VOR reasons. Here is the updated Serv State..."
            );
            // console.log("Before restart: ", ctx.session);
            restartCtxSession(ctx);
            // console.log("After restart: ", ctx.session);
            return sendServState(
              { bot, prisma, vehicle_count, chargerTypes, vehicleTypes },
              ctx
            );
          } catch (error) {
            console.error("Error: ", error);
            return botSendMessage(
              ctx,
              "An error occurred when trying to update the database for moving vehicles/chargers from SVC to VOR"
            );
          }
        } catch (error) {
          console.error("Error: ", error);
          await botSendMessage(ctx, error.message);
          return botSendMessage(
            ctx,
            "Some key points to check:\n1. Ensure that the vehicle/charger numbers actually exist\n2. Ensure that your date is written in the correct format of DD/MM/YYYY E.g. 30/09/2004\n3. Ensure that you have all and only the following parts: vehicle number - vor reason - date_reported (IMPT!)."
          );
        }
      } catch (error) {
        console.error("Error: ", error);
        return botSendMessage(
          ctx,
          "An error occurred when retrieving the full list of vehicles and chargers"
        );
      }

      break;
    case "3":
      // For Option 3 to update VOR messages
      break;

    default:
      break;
  }
}
/* 
46088 - Cannot start - 24/07/2024
46089 - Wheel burst - 25/07/2016
*/
