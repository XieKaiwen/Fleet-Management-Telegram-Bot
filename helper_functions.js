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

function convertDateFormat(dateString) {
  const [day, month, year] = dateString.split("/");
  return `${year}-${month}-${day}`;
}

export async function editServStateStep1(
  { bot, prisma, vehicle_count, chargerTypes, vehicleTypes },
  ctx,
  text
) {
  // console.log("REACHED HERE");
  // console.log("Text: ", text);
  await sendServState(
    { bot, prisma, vehicle_count, chargerTypes, vehicleTypes },
    ctx
  );
  switch (text) {
    case "1":
      // VOR to SVC
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
        "Please enter the vehicles/chargers you wish to move from SVC to VOR, including the VOR information. Each vehicle/charger and VOR information should go on a new line. Follow the format 'item_number - VOR_reason - date_reported'\n\nExample:\nvehicle_1 - vor_reason - DD/MM/YYYY\nvehicle_2 - vor_reason - DD/MM/YYYY\nvehicle_3 - vor_reason - DD/MM/YYYY\n\nIf there are more than one VOR reasons found on two separate dates, they should be entered on separate lines. Format for date has to be followed STRICTLY."
      );
      ctx.session.input[ctx.session.cur_step] = text;
      ctx.session.cur_step++;
      break;

    case "3":
      // Updating VOR info : 1. Replace entire VOR message 2. Append a message to the end of the entire thing
      await botSendMessage(
        ctx,
        "You have chosen to update VOR reasons for vehicle/charger. Choose one of the following options to proceed:\n\n1. Replace entire VOR reason (To change the entire VOR reason)\n2. Append VOR reasons (For adding latest updates)"
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

    case "3":
      // For Option 3 to update VOR messages: Replace VOR messages or add VOR messages
      if (text === "1" || text === "2") {
        ctx.session.input[ctx.session.cur_step] = text;
        ctx.session.cur_step++;
        if (text === "1") {
          return botSendMessage(
            ctx,
            "To replace VOR reasons, enter the new VOR reason in the format: vehicle/charger_num - vor_reason - DD/MM/YYYY.\nFor separate vehicles, write them on separate lines, only ONE line per vehicle is allowed, follow the format STRICTLY.\n\nExample:\n46086 - Wheel burst - 28/12/2004\n51012 - Low battery - 01/01/2004\n50701 - Cannot start - 12/09/2015"
          );
        } else if (text === "2") {
          return botSendMessage(
            ctx,
            "To append VOR reasons, enter the new VOR reasons in the format: vehicle/charger_num - vor_reason - DD/MM/YYYY.\nTo add multiple VOR reasons for the same vehicle but on different dates, enter on separate lines\nFor separate vehicles, write them on separate lines.\n\nExample:\n46086 - Wheel burst - 28/12/2004\n46086 - Cannot start - 30/12/2004\n51012 - Low battery - 01/01/2004\n50701 - Cannot start - 12/09/2015"
          );
        }
      } else {
        await botSendMessage(
          ctx,
          `${text} is not an appropriate input for the command, please enter an appropriate input.\n1. Replace entire VOR reason (To change the entire VOR reason)\n2. Append VOR reasons (For adding latest updates)`
        );
        break;
      }

    default:
      break;
  }
}

export async function editServStateStep3(
  { bot, prisma, vehicle_count, chargerTypes, vehicleTypes },
  ctx,
  text
) {
  switch (ctx.session.input[1]) {
    case "3":
      // only for update VOR message, the input here is 1 for replace VOR reason 2 is append VOR reason.

      switch (ctx.session.input[2]) {
        case "1":
          // Replace VOR message
          // 1. Split the input by newline character
          try {
            const splitLines = text.split("\n");
            const fullVORVehicleList = await prisma.vehicles.findMany({
              select: {
                vec_num: true,
              },
              where:{
                isvor: true
              }
            });
            const fullVORChargerList = await prisma.chargers.findMany({
              select: {
                charger_num: true,
              },
              where: {
                isvor: true
              }
            });
            const fullVORVehicleAndChargerList = {
              vehicleNumbers: fullVORVehicleList.map((v) => v.vec_num),
              chargerNumbers: fullVORChargerList.map((c) => c.charger_num),
            };
            // 2. Validate each line by first splitting them by " - " then validating each part of the line. Add invalid lines to an array, then output them
            // Regex for date checking, check if vehicle is in full vehicle list
            const invalidLines = [];
            const itemsToReplaceVOR = {
              vehicles: {},
              chargers: {},
            };
            // inside vehicles/chargers we have vec_num: {dateReported: , vorReason: }
            splitLines.forEach((line) => {
              const lineParts = line.split(" - ");
              if (lineParts.length == 3) {
                // Check if the line has all 3 parts
                const [item, vorReason, dateReported] = lineParts;
                if (fullVORVehicleAndChargerList.vehicleNumbers.includes(item)) {
                  if (
                    !/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/([0-9]{4})$/.test(
                      dateReported
                    )
                  ) {
                    invalidLines.push(line);
                  } else {
                    itemsToReplaceVOR.vehicles[item] = {
                      dateReported: convertDateFormat(dateReported),
                      vorReason: vorReason,
                    };
                  }
                } else if (
                  fullVORVehicleAndChargerList.chargerNumbers.includes(item)
                ) {
                  if (
                    !/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/([0-9]{4})$/.test(
                      dateReported
                    )
                  ) {
                    invalidLines.push(line);
                  } else {
                    itemsToReplaceVOR.chargers[item] = {
                      dateReported: convertDateFormat(dateReported),
                      vorReason: vorReason,
                    };
                  }
                } else {
                  invalidLines.push(line);
                }
              } else {
                invalidLines.push(line);
              }
            });
            // return a botSendMessage if there are invalid lines
            if (invalidLines.length > 0) {
              const invalidLinesJoined = invalidLines.join("\n");
              await botSendMessage(
                ctx,
                `The following lines are invalid, please check and edit appropriately\n\n${invalidLinesJoined}`
              );
              return botSendMessage(
                ctx,
                "Some key points to check:\n\n1. Ensure that the vehicle/charger numbers actually exist\n2. Ensure that your date is written in the correct format of DD/MM/YYYY E.g. 30/09/2004\n3. Ensure that you have all and only the following parts: item_number - vor reason - date_reported (IMPT!).\n4. Ensure that all vehicles/chargers entered are already VOR status, if you wish to change SVC to VOR, cancel this session and choose the other option in the previous step."
              );
            }
            // 3. Delete existing VOR reasons for the vehicle/charger
            try {
              const { vehicles, chargers } = itemsToReplaceVOR;

              await prisma.$transaction(async (prisma) => {
                // Get IDs of vehicles and chargers that exist in the database
                const vehicleIds = await prisma.vehicles.findMany({
                  where: {
                    vec_num: { in: Object.keys(vehicles) },
                  },
                  select: { id: true },
                });

                const chargerIds = await prisma.chargers.findMany({
                  where: {
                    charger_num: { in: Object.keys(chargers) },
                  },
                  select: { id: true },
                });

                // Delete existing VOR reasons for vehicles
                await prisma.vehicle_vor_reason.deleteMany({
                  where: {
                    vec_id: { in: vehicleIds.map((vehicle) => vehicle.id) },
                  },
                });

                // Delete existing VOR reasons for chargers
                await prisma.charger_vor_reason.deleteMany({
                  where: {
                    charger_id: { in: chargerIds.map((charger) => charger.id) },
                  },
                });

                // Insert new VOR reasons for vehicles
                for (const [
                  vec_num,
                  { dateReported, vorReason },
                ] of Object.entries(vehicles)) {
                  const vehicle = await prisma.vehicles.findUnique({
                    where: { vec_num },
                  });
                  if (vehicle) {
                    await prisma.vehicle_vor_reason.create({
                      data: {
                        vec_id: vehicle.id,
                        date_reported: new Date(dateReported).toISOString(),
                        vor_reason: vorReason,
                      },
                    });
                  }
                }

                // Insert new VOR reasons for chargers
                for (const [
                  charger_num,
                  { dateReported, vorReason },
                ] of Object.entries(chargers)) {
                  const charger = await prisma.chargers.findUnique({
                    where: { charger_num },
                  });
                  if (charger) {
                    await prisma.charger_vor_reason.create({
                      data: {
                        charger_id: charger.id,
                        date_reported: new Date(dateReported).toISOString(),
                        vor_reason: vorReason,
                      },
                    });
                  }
                }
              });
              restartCtxSession(ctx);
              await botSendMessage(ctx,
                "VOR reasons replaced. Here is the updated serv states...\n\n"
              );
              return sendServState({
                bot,
                prisma,
                vehicle_count,
                chargerTypes,
                vehicleTypes
              }, ctx);
            } catch (error) {
              console.error(error);
              return botSendMessage(
                ctx,
                "Error occurred when trying to replace VOR messages. Please try again"
              );
            }
          } catch (error) {
            console.error(error);
            return botSendMessage(
              ctx,
              "An error occurred when trying to retrieve vehicles and chargers from database."
            );
          }

        case "2":
          // Append VOR reason
          // TODO Append VOR reason (just same format, add the vor_reasons into the tables)
          break;

        default:
          break;
      }
      break;
    default:
      break;
  }
}
/* 
46088 - Cannot start - 24/07/2024
46089 - Wheel burst - 25/07/2016
*/

// TODO write a function to show FULL vehicle list
