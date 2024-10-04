import { Telegraf } from "telegraf";

// Initialize the bot
export const bot = new Telegraf(process.env.BOT_TOKEN, {
    telegram: { webhookReply: true },
  });