import { format } from "date-fns";
import { defParams } from "../lib/constants";
import prisma from "../prismaClient/prisma.js";
import {
  formatServStateSection,
  formatVehicleLine,
  formatVORSection,
  formatWPTSections,
  groupItemsByType,
} from "../helper_functions.js";
import {
  DataFetchingError,
  DataMutationError,
  InvalidLinesError,
} from "../lib/utils/errorMessageConstructors.js";
import {
  constructMultilineInstructions,
  INVALID_ITEM_ERROR_REMINDER_ALL_SVC,
  INVALID_ITEM_ERROR_REMINDER_ALL_VOR,
  MULTILINE_INVALID_INPUT_REMINDER,
  ONLY_VOR_REMINDER,
  REPLACE_VOR_MESSAGE_INSTRUCTIONS,
  VOR_MULTILINE_INPUT,
  VOR_TO_SVC_INSTRUCTIONS,
} from "./instructions.js";
import {
  parseCommaSeparatedItems,
  parseRowsWithItemVORReasonDate,
  separateItemInInputByComma,
  validateCommaSeparatedItems,
  validateRowsWithItemVORReasonDate,
} from "../lib/utils/inputHandlerUtils.js";
import { SERV_STATE_EDIT_SUCCESS } from "../lib/utils/successMessages.js";
import { getAllChargers, getAllVehicles } from "../lib/utils/retrieveDataUtils.js";

const { vehicle_count, chargerTypes, vehicleTypes } = defParams;

// REFACTOR THIS ENTIRE CHUNK

// First need to list down everything that needs to be refactored

/**
 * Refactor parsing the vor messages into the requried format.
 * Refactor sorting by date
 * Refactor the different error messages and the template messages sent by the bot
 * those functions can go into helper functions
 */

export async function sendServState(ctx) {
  try {
    const vehiclesWithVorReasons =
      await prisma.vehicles.getVORVehiclesWithReasons();

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

    // Group vehicles by type
    const VORvehicleDataGroupedByType = groupItemsByType(
      vehiclesWithVorReasonsFormattedDate,
      vehicleTypes
    );

    // console.log(JSON.stringify(VORvehicleDataGroupedByType, null, 2));
    const currentDate = getCurrentDateInSingapore();
    try {
      const chargersWithVORReasons =
        await prisma.chargers.getVORChargersWithReasons();

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

      //   Group the chargers by type
      const VORchargerGroupedByType = groupItemsByType(
        chargersWithVORReasonsFormattedDate,
        chargerTypes
      );

      let serv_state_msg = `SERV STATE OF FM VEH ${currentDate}`;

      serv_state_msg += formatServStateSection(
        VORvehicleDataGroupedByType,
        vehicle_count,
        formatVehicleLine
      );

      serv_state_msg += formatVORSection(
        VORchargerGroupedByType,
        vehicle_count, // Use a separate count object if necessary
        formatChargerLine
      );

      return botSendMessage(ctx, serv_state_msg);
    } catch (error) {
      console.error(error);
      return botSendMessage(ctx, DataFetchingError("VOR Chargers"));
    }
  } catch (error) {
    console.log("Error: ", error);
    return botSendMessage(ctx, DataFetchingError("VOR vehicles"));
  }
}

export async function sendWPT(ctx) {
  try {
    const notDrivenVehicles = await prisma.vehicles.getSVCVehiclesNotDriven();

    const currentDate = getCurrentDateInSingapore();

    let WPTMessage = `MHE & OPS Keypress Check: Done (${currentDate})\n\nLogbook Check: Done (${currentDate})\n\nPlatforms yet to be used this week:\n`;

    const notDrivenVehiclesGroupedByType = groupItemsByType(
      notDrivenVehicles,
      vehicleTypes
    );
    // console.log(notDrivenVehiclesGroupedByType);

    WPTMessage += formatWPTSections(
      "Platforms yet to be used this week",
      notDrivenVehiclesGroupedByType,
      vehicleTypes
    );

    try {
      const VORvehicles = await prisma.vehicles.getVORVehicles();

      const VORVehiclesGroupedByType = groupItemsByType(
        VORvehicles,
        vehicleTypes
      );

      WPTMessage += "\n==========U/S===========\n";

      WPTMessage += formatWPTSections(
        "VOR Vehicles",
        VORVehiclesGroupedByType,
        vehicleTypes
      );

      return botSendMessage(ctx, WPTMessage);
    } catch (error) {
      console.error(error);
      return botSendMessage(ctx, DataFetchingError("VOR Vehicles"));
    }
  } catch (error) {
    console.error(error);
    return botSendMessage(ctx, DataFetchingError("Vehicles not driven"));
  }
}

export async function botSendMessage(ctx, message, type = "normal") {
  if (type === "normal") {
    await ctx.reply(`@${ctx.from.username}\n${message}`);
  } else if (type === "error") {
    await ctx.reply(`@${ctx.from.username}\nError: ${message}`);
  } else if (type === "markdown") {
    await ctx.replyWithMarkdown(`@${ctx.from.username}\n${message}`);
  }
}

export async function editServStateStep1(ctx, text) {
  // console.log("REACHED HERE");
  // console.log("Text: ", text);
  await sendServState(ctx);
  switch (text) {
    case "1":
      // VOR to SVC
      await botSendMessage(ctx, VOR_TO_SVC_INSTRUCTIONS);
      ctx.session.input[ctx.session.cur_step] = text;
      ctx.session.cur_step++;
      break;

    case "2":
      // SVC to VOR
      await botSendMessage(
        ctx,
        constructMultilineInstructions(
          "Please enter the vehicles or chargers you wish to move from SVC to VOR, along with their VOR information."
        )
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
export async function editServStateStep2(ctx, text) {
  // Step 2. Users sending in the input for /edit_serv_state
  switch (ctx.session.input[1]) {
    case "1": {
      // Separate list of vehicles into an array and then move them to SVC using prisma
      const itemToSVCList = separateItemInInputByComma(text);
      console.log(itemToSVCList);
      // Check if all the vehicles are valid vehicles
      try {
        const { invalidItems, allItemsNumbers } =
          await validateCommaSeparatedItems(itemToSVCList, true);
        if (invalidItems.length > 0) {
          await botSendMessage(ctx, InvalidLinesError(invalidItems));
          return botSendMessage(ctx, INVALID_ITEM_ERROR_REMINDER_ALL_VOR);
        }
        const { vehicles: vehicleNumToChange, chargers: chargerNumToChange } =
          parseCommaSeparatedItems(itemToSVCList, allItemsNumbers);
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
          return sendServState(ctx);
        } catch (error) {
          console.error("Error: ", error);
          return botSendMessage(ctx, DataMutationError("Serv State"), "error");
        }
      } catch (error) {
        console.log("Error: ", error);
        return botSendMessage(
          ctx,
          DataFetchingError("vehicles/chargers"),
          "error"
        );
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
        */
      try {
        const separatedLines = text.split("\n");
        console.log("Separated lines: ", separatedLines);
        const { invalidLines, allItemsNumbers } =
          validateRowsWithItemVORReasonDate(separatedLines, false, true);

        if (invalidLines.length > 0) {
          await botSendMessage(ctx, InvalidLinesError(invalidLines));
          return botSendMessage(
            ctx,
            MULTILINE_INVALID_INPUT_REMINDER,
            "markdown"
          );
        }

        const { vehiclesToMove, chargersToMove } =
          parseRowsWithItemVORReasonDate(separatedLines, allItemsNumbers);
        try {
          await prisma.$transaction(async (prisma) => {
            const vehicleReasonInserts = [];
            const chargerReasonInserts = [];

            const vecNums = Object.keys(vehiclesToMove);
            const chargerNums = Object.keys(chargersToMove);
            // Prepare vehicle updates and inserts
            for (const vecNum in vehiclesToMove) {
              const vorReasons = vehiclesToMove[vecNum];

              // Prepare vor reasons inserts
              for (const {
                vorReason: reason,
                dateReported: date,
              } of vorReasons) {
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
            for (const chargerNum in chargersToMove) {
              const vorReasons = chargersToMove[chargerNum];

              // Prepare vor reasons inserts
              for (const {
                vorReason: reason,
                dateReported: date,
              } of vorReasons) {
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

          await botSendMessage(ctx, SERV_STATE_EDIT_SUCCESS);
          // console.log("Before restart: ", ctx.session);
          restartCtxSession(ctx);
          // console.log("After restart: ", ctx.session);
          return sendServState(ctx);
        } catch (error) {
          console.error("Error: ", error);
          return botSendMessage(
            ctx,
            DataMutationError("moving vehicles/chargers from SVC to VOR")
          );
        }
      } catch (error) {
        console.error("Error: ", error);
        return botSendMessage(ctx, DataFetchingError("vehicle/chargers"));
      }

    case "3":
      // For Option 3 to update VOR messages: Replace VOR messages or add VOR messages
      if (text === "1" || text === "2") {
        ctx.session.input[ctx.session.cur_step] = text;
        ctx.session.cur_step++;
        if (text === "1") {
          await botSendMessage(ctx, ONLY_VOR_REMINDER);
          return botSendMessage(ctx, REPLACE_VOR_MESSAGE_INSTRUCTIONS);
        } else if (text === "2") {
          await botSendMessage(ctx, ONLY_VOR_REMINDER);
          return botSendMessage(
            ctx,
            constructMultilineInstructions(
              "Please enter the vehicles or chargers you wish append VOR messages to."
            )
          );
        }
      } else {
        return botSendMessage(
          ctx,
          `${text} is not an appropriate input for the command, please enter an appropriate input.\n1. Replace entire VOR reason (To change the entire VOR reason)\n2. Append VOR reasons (For adding latest updates)`
        );
      }
      break;
    default:
      break;
  }
}

export async function editServStateStep3(ctx, text) {
  switch (ctx.session.input[1]) {
    case "3":
      // only for update VOR message, the input here is 1 for replace VOR reason 2 is append VOR reason.
      switch (ctx.session.input[2]) {
        case "1":
          // Replace VOR message
          // 1. Split the input by newline character
          try {
            const splitLines = text.split("\n");
            const { invalidLines, allItemsNumbers } =
              await validateRowsWithItemVORReasonDate(splitLines, true);

            if (invalidLines.length > 0) {
              await botSendMessage(
                ctx,
                InvalidLinesError(invalidLines),
                "error"
              );
              return botSendMessage(
                ctx,
                MULTILINE_INVALID_INPUT_REMINDER + "\n\n" + ONLY_VOR_REMINDER,
                "markdown"
              );
            }

            const { vehicles, chargers } = parseRowsWithItemVORReasonDate(
              splitLines,
              allItemsNumbers
            );
            try {
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
              await botSendMessage(
                ctx,
                "VOR reasons replaced. Here is the updated Serv State...\n\n"
              );
              return sendServState(ctx);
            } catch (error) {
              console.error(error);
              return botSendMessage(
                ctx,
                DataMutationError("replacing VOR reasons")
              );
            }
          } catch (error) {
            console.error(error);
            return botSendMessage(ctx, DataFetchingError("vehicles/chargers"));
          }

        case "2":
          // Append VOR reason
          // TODO Append VOR reason (just same format, add the vor_reasons into the tables)
          try {
            const splitLines = text.split("\n");
            const { invalidLines, allItemsNumbers } =
              await validateRowsWithItemVORReasonDate(splitLines, true);

            if (invalidLines.length > 0) {
              await botSendMessage(
                ctx,
                InvalidLinesError(invalidLines),
                "error"
              );
              return botSendMessage(
                ctx,
                MULTILINE_INVALID_INPUT_REMINDER + "\n\n" + ONLY_VOR_REMINDER,
                "markdown"
              );
            }
            const itemsToAppendFormatted = parseRowsWithItemVORReasonDate(
              splitLines,
              allItemsNumbers
            );

            try {
              await prisma.$transaction(async (prisma) => {
                for (const [vecNum, vorInfoList] of Object.entries(
                  itemsToAppendFormatted.vehicles
                )) {
                  const { id } = await prisma.vehicles.findUnique({
                    where: {
                      vec_num: vecNum,
                    },
                  });

                  const vehicleQueries = vorInfoList.map(
                    ({ dateReported, vorReason }) => {
                      return prisma.vehicle_vor_reason.create({
                        data: {
                          vec_id: id,
                          date_reported: new Date(dateReported).toISOString(),
                          vor_reason: vorReason,
                        },
                      });
                    }
                  );
                  await Promise.all(vehicleQueries);
                  // Insert new vor reasons for vehicles ^
                }

                for (const [chargerNum, vorInfoList] of Object.entries(
                  itemsToAppendFormatted.chargers
                )) {
                  const { id } = await prisma.chargers.findUnique({
                    where: {
                      charger_num: chargerNum,
                    },
                  });

                  const chargerQueries = vorInfoList.map(
                    ({ dateReported, vorReason }) => {
                      return prisma.charger_vor_reason.create({
                        data: {
                          charger_id: id,
                          date_reported: new Date(dateReported).toISOString(),
                          vor_reason: vorReason,
                        },
                      });
                    }
                  );
                  await Promise.all(chargerQueries);
                  // Insert new vor reasons for chargers ^
                }
                restartCtxSession(ctx);
                await botSendMessage(
                  ctx,
                  "Successfully appended VOR reasons! Here is the new serv state..."
                );
                return sendServState(ctx);
              });
            } catch (error) {
              console.error(error);
              return botSendMessage(
                ctx,
                DataMutationError("appending VOR reasons")
              );
            }
          } catch (error) {
            console.error(error);
            return botSendMessage(ctx, DataFetchingError("vehicles/chargers"));
          }

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
export async function sendFullList(ctx) {
  const allVehicles = await getAllVehicles();
  const allChargers = await getAllChargers();

  const vehicleByType = {};
  const chargersByType = {};
  allVehicles.forEach((vehicle) => {
    const { type, vec_num } = vehicle;
    if (!(type in vehicleByType)) {
      vehicleByType[type] = [];
    }
    vehicleByType[type].push(vec_num);
  });
  allChargers.forEach((charger) => {
    const { type, charger_num } = charger;
    if (!(type in chargersByType)) {
      chargersByType[type] = [];
    }
    chargersByType[type].push(charger_num);
  });

  // Construct the message
  let fullVehicleAndChargerMessage =
    "FULL VEHICLE AND CHARGER LIST:\n========================================\n";

  for (const type in vehicleByType) {
    vehicleByType[type].sort();
    fullVehicleAndChargerMessage += `\n${type}\n`;
    fullVehicleAndChargerMessage += vehicleByType[type].join(", ") + "\n";
  }
  for (const type in chargersByType) {
    chargersByType[type].sort();
    fullVehicleAndChargerMessage += `\n${type}\n`;
    fullVehicleAndChargerMessage += chargersByType[type].join(", ") + "\n";
  }

  await botSendMessage(ctx, "Here is the full list of vehicle and chargers...");
  return botSendMessage(ctx, fullVehicleAndChargerMessage);
}
