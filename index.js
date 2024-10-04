// Using import statements instead of require
import express from "express";
import path, { dirname } from "path";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import ngrok from "ngrok";
import { botSessionMiddleware } from "./middleware/middleware.js";
import { bot } from "./botController/bot.js";
import { addBotCommands } from "./botController/botCommands.js";

config();

// Setup __dirname equivalent in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express
const expressApp = express();
const port = process.env.PORT || 3000;

// Middleware to serve static files
expressApp.use(express.static("static"));
expressApp.use(express.json());

const sessionStore = {};

bot.use(botSessionMiddleware);

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


addBotCommands(bot)