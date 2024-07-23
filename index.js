// Using import statements instead of require
import express from "express";
import path, { dirname } from "path";
import { Telegraf } from "telegraf";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import {
  botSendMessage,
  restartCtx,
  sendServState,
  sendWPT,
} from "./helper_functions.js";
import ngrok from "ngrok";
import { isBoxedPrimitive } from "util/types";

config();
// Using Prisma ORM
const prisma = new PrismaClient();

// Setup __dirname equivalent in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express
const expressApp = express();
const port = process.env.PORT || 3000;

// Middleware to serve static files
expressApp.use(express.static("static"));
expressApp.use(express.json());

// Initialize the bot
const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: { webhookReply: false },
});
const sessionStore = {};
function botSessionMiddleware(ctx, next) {
  const userId = ctx.from && ctx.from.id;
  const chatId = ctx.chat && ctx.chat.id;

  // Create a unique key for each session (based on user and chat ID)
  const sessionId = `${chatId}:${userId}`;

  // Retrieve session data or initialize it if it doesn't exist
  if (!sessionStore[sessionId]) {
    sessionStore[sessionId] = {
      state: "idle",
      cur_command: null,
      cur_step: null,
      input: {},
    }; // Initialize a new session object
  }

  // Attach session data to the context
  ctx.session = sessionStore[sessionId];
  console.log("CTX session: ", ctx.session);
  ctx.message.text = ctx.message.text.trim();
  console.log("CTX message: ", ctx.message.text);
  // Proceed with the middleware chain
  return next();
}
bot.use(botSessionMiddleware);

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

console.log(vehicleTypes);

const chargerTypes = ["ESL CHARGER", "EFL CHARGER"];

// Start ngrok and set the webhook
await (async function () {
  try {
    // Connect ngrok to the specified port
    const url = await ngrok.connect(port);
    const WEBHOOK_URL = `${url}/telegram-webhook`;
    // Set the webhook for the bot
    await bot.telegram.setWebhook(WEBHOOK_URL);
    console.log(`Webhook set to ${WEBHOOK_URL}`);

    // Webhook handler for incoming Telegram updates
    expressApp.post("/telegram-webhook", (req, res) => {
      // console.log("Received update from Telegram:", req.body);
      bot
        .handleUpdate(req.body)
        .then(() => {
          if (!res.headersSent) {
            res.sendStatus(200);
          }
        })
        .catch((error) => {
          console.error("Error in webhook handler:", error);
          if (!res.headersSent) {
            res.sendStatus(500);
          }
        });
    });

    // Root endpoint to serve the main page
    expressApp.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "/index.html"));
    });

    // Start the Express server
    expressApp.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Error setting up webhook or server:", err);
  }
})();

bot.command("start", (ctx) => {
  console.log(ctx.from);
  // ctx.session.state = 'idle'
  // ctx.session.cur_command = null
  return botSendMessage(ctx, "Hello there! I am the FM helper bot.");
});

bot.command("health_check", (ctx) => {
  // console.log(ctx.from);
  if (ctx.session.state != "idle") {
    return botSendMessage(
      ctx,
      `Unable to perform health check, you are still in a command session for /${ctx.session.cur_command}. If you wish to terminate the command, please enter /cancel`
    );
  }
  return botSendMessage(ctx, "Health OK. Bot is up and functional");
});

bot.command("serv_state", async (ctx) => {
  if (ctx.session.state != "idle") {
    return botSendMessage(
      ctx,
      `Unable to send serv state, you are still in a command session for /${ctx.session.cur_command}. If you wish to terminate the command, please enter /cancel`
    );
  }
  return sendServState(
    bot,
    prisma,
    ctx,
    vehicle_count,
    chargerTypes,
    vehicleTypes
  );
});

bot.command("show_wpt", async (ctx) => {
  if (ctx.session.state != "idle") {
    return botSendMessage(
      ctx,
      `Unable to send WPT list, you are still in a command session for /${ctx.session.cur_command}. If you wish to terminate the command, please enter /cancel`
    );
  }
  return sendWPT(bot, prisma, ctx, vehicle_count, chargerTypes, vehicleTypes);
});

bot.command("edit_serv_state", async (ctx) => {
  if (
    ctx.session.state != "idle" &&
    ctx.session.cur_command !== "edit_serv_state"
  ) {
    return botSendMessage(
      ctx,
      `Unable to send edit serv state, you are still in a command session for /${ctx.session.cur_command}. If you wish to terminate the command, please enter /cancel`
    );
  }
  ctx.session.state = "in_command";
  ctx.session.cur_command = "edit_serv_state";
  ctx.session.cur_step = 1;
  await botSendMessage(
    ctx,
    "You have started a session to edit serv state! Please follow the following instructions..."
  );
  return botSendMessage(
    ctx,
    "What changes do you want to make to the serv_state?\n1 - Move vehicle/charger from VOR to SVC\n2 - Move vehicle/charger to VOR\n3 - Update VOR information of vehicle/charger"
  );
});

bot.command("cancel", async (ctx) => {
  if (ctx.session.state === "idle") {
    return botSendMessage(
      ctx,
      "No existing command sessions. You are free to enter a new command!"
    );
  }
  const command = ctx.session.cur_command;
  restartCtx(ctx);
  return botSendMessage(
    ctx,
    `Existing command session for /${command} has been cleared. You can enter a new command now!`
  );
});

// Handling undefined commands
bot.on("message", async (ctx) => {
  if (ctx.message.text && ctx.message.text.startsWith("/")) {
    return botSendMessage(
      ctx,
      "Sorry, I didn’t recognize that command. Type /help for a list of available commands."
    );
  }
  const text = ctx.message.text;
  switch (ctx.session.cur_command) {
    case "edit_serv_state":
      if (ctx.session.cur_step === 1) {
        switch (text) {
          case "1":
            // VOR to SVC
            await sendServState(
              bot,
              prisma,
              ctx,
              vehicle_count,
              chargerTypes,
              vehicleTypes
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
              "Please enter the vehicles/chargers you wish to move from SVC to VOR, including the VOR information. Each vehicle/charger and VOR information should go on a new line. Follow the format 'vehicle_number, VOR_reason, date_reported' \nExample:\n46087, Cannot start, 24-06-2003\n46087, Found fault in engine, 29-06-2003\n51000, Hydraulic driver require replacement, 20-07-2022\nIf there are more than one VOR reasons found on two separate dates, they should be entered on separate lines BUT in chronological order. Format for date has to be followed STRICTLY."
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
      } else if (ctx.session.cur_step === 2) {
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
                let vehicleNumToChange = []
                let chargerNumToChange = []
                itemToSVCList.forEach((item) => {
                  if (
                    !fullVehicleAndChargerList.vehicleNumbers.includes(item) &&
                    !fullVehicleAndChargerList.chargerNumbers.includes(item)
                  ) {
                    // throw new Error(`${item} does not exist in the list of vehicles. Please make an edit and send the vehicle/charger list again to proceed with the command.`)
                    invalidItems.push(item);
                  }else{
                    if(fullVehicleAndChargerList.vehicleNumbers.includes(item)){
                      vehicleNumToChange.push(item)
                    }else{
                      chargerNumToChange.push(item)
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
                    restartCtx(ctx);
                    await botSendMessage(
                      ctx,
                      "Serv state successfully updated, command session ended! Here is the updated serv_state..."
                    );
                    return sendServState(
                      bot,
                      prisma,
                      ctx,
                      vehicle_count,
                      chargerTypes,
                      vehicleTypes
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
            break;
          case "3":
            // For Option 3 to update VOR messages
            break;

          default:
            break;
        }
      }

      break;

    default:
      await botSendMessage(ctx, "Irrelevant message. Please type in a command");
      break;
  }
});
