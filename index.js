// Using import statements instead of require
import express from "express";
import path, { dirname } from "path";
import { Telegraf } from "telegraf";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import {
  botSendMessage,
  editServStateStep1,
  editServStateStep2,
  editServStateStep3,
  restartCtxSession,
  sendFullList,
  sendServState,
  sendWPT,
} from "./helper_functions.js";
import ngrok from "ngrok";

config();
// Using Prisma ORM
export const prisma = new PrismaClient();

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
export const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: { webhookReply: true },
});
const sessionStore = {};
function botSessionMiddleware(ctx, next) {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;

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
  if (ctx.message && ctx.message.text) {
    ctx.message.text = ctx.message?.text.trim();
  } else if (ctx.edited_message && ctx.edited_message.text) {
    ctx.edited_message.text = ctx.edited_message?.text.trim();
  }

  console.log("CTX message: ", ctx.message?.text);
  console.log("CTX editted message: ", ctx.edited_message?.text);
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
  bot,
  prisma,
  vehicle_count,
  chargerTypes,
  vehicleTypes,
};

// Start ngrok and set the webhook
await (async function () {
  const NODE_ENV = process.env.NODE_ENV;
  try {
    // Connect ngrok to the specified port
    const url =
      NODE_ENV === "dev" ? await ngrok.connect(port) : process.env.BASE_URL;
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
  return sendServState(defParams, ctx);
});

bot.command("show_wpt", async (ctx) => {
  if (ctx.session.state != "idle") {
    return botSendMessage(
      ctx,
      `Unable to send WPT list, you are still in a command session for /${ctx.session.cur_command}. If you wish to terminate the command, please enter /cancel`
    );
  }
  return sendWPT(defParams, ctx);
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
    "What changes do you want to make to the serv_state?\n\n1 - Move vehicle/charger from VOR to SVC\n2 - Move vehicle/charger to VOR\n3 - Update VOR information of vehicle/charger"
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
  restartCtxSession(ctx);
  return botSendMessage(
    ctx,
    `Existing command session for /${command} has been cleared. You can enter a new command now!`
  );
});

bot.command("send_full_list", async (ctx) => {
  await sendFullList(ctx)
})

// Handling undefined commands
bot.on("message", async (ctx) => {
  if (ctx.message?.text.startsWith("/")) {
    return botSendMessage(
      ctx,
      "Sorry, I didn’t recognize that command. Type /help for a list of available commands."
    );
  }
  const text = ctx.message?.text || ctx.edited_message?.text;
  switch (ctx.session.cur_command) {
    case "edit_serv_state":
      if (ctx.session.cur_step === 1) {
        await editServStateStep1(defParams, ctx, text);
      } else if (ctx.session.cur_step === 2) {
        await editServStateStep2(defParams, ctx, text);
      } else if (ctx.session.cur_step === 3) {
        await editServStateStep3(defParams, ctx, text); // only update VOR reason has a step 3
      }
      break;

    default:
      // await botSendMessage(ctx, "Irrelevant message. Please type in a command");
      break;
  }
});
// TODO updateVehicleDriven command, with node scheduler
