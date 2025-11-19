// Using import statements instead of require
import express from "express";
import path, { dirname } from "path";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import ngrok from "@ngrok/ngrok";
import { botCheckSessionMiddleware, botSessionMiddleware } from "./middleware/middleware.js";
import { bot } from "./botController/bot.js";
import { addBotCommands } from "./botController/botCommands.js";
import cron from "node-cron";
import prisma from "./prisma-client/prisma.js";
config();

// Setup __dirname equivalent in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("Bot Token:", process.env.BOT_TOKEN)

// Initialize Express
const expressApp = express();
const port = parseInt(process.env.PORT) || 3000;

// Middleware to serve static files
expressApp.use(express.static("static"));
expressApp.use(express.json());

bot.use(botSessionMiddleware);
bot.use(botCheckSessionMiddleware);

// Start ngrok and set the webhook
await (async function () {
  try {
    let url;

    // Ngrok setup for Docker environment
    console.log('Setting up ngrok tunnel...');

    // Kill any existing ngrok processes and disconnect all tunnels
    try {
      // First try to disconnect all existing tunnels
      await ngrok.disconnect();
      console.log('Disconnected all existing ngrok tunnels');
    } catch (e) {
      console.log('No existing tunnels to disconnect');
    }

    try {
      // Then kill the ngrok process
      await ngrok.kill();
      console.log('Killed existing ngrok processes');
    } catch (e) {
      console.log('No existing ngrok process to kill');
    }

    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      console.log(`Connecting ngrok to port ${port}...`);
      console.log(`Auth token present: ${process.env.NGROK_AUTHTOKEN ? 'Yes' : 'No'}`);

      // Validate auth token before proceeding
      if (!process.env.NGROK_AUTHTOKEN || process.env.NGROK_AUTHTOKEN === 'your_ngrok_authtoken_here') {
        throw new Error('NGROK_AUTHTOKEN is not set or is using the placeholder value. Please set a valid ngrok auth token.');
      }

      console.log(`Connecting ngrok to port ${port} using official @ngrok/ngrok package...`);
   
      url = (await ngrok.forward({
        addr: port,
        authtoken: process.env.NGROK_AUTHTOKEN
      })).url();

      if (url) {
        console.log(`ngrok tunnel successfully established: ${url}`);
      } else {
        throw new Error('No URL returned from ngrok');
      }
    } catch (error) {
      console.error(`Failed to establish ngrok tunnel:`, error.message);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });

      throw error;
    }

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

addBotCommands(bot);

cron.schedule(
  "59 23 * * 0",
  async () => {
    console.log("Set all vehicles as undriven");
    await prisma.vehicles.setAllVehiclesUndriven();
  },
  {
    scheduled: true,
    timezone: "Asia/Singapore", // You can change the timezone if needed
  }
);

console.log("Added bot commands and scheduled updating all vehicles as undriven");

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('\nReceived shutdown signal, cleaning up...');

  try {
    // Kill ngrok tunnels
    console.log('Killing ngrok tunnels...');
    await ngrok.kill();
    console.log('ngrok tunnels cleaned up');
  } catch (error) {
    console.error('Error during ngrok cleanup:', error);
  }

  // Close database connection
  try {
    await prisma.$disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }

  process.exit(0);
};

// Register shutdown handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // For nodemon restarts


