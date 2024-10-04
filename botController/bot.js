import { Telegraf } from "telegraf";
import { BOT_TOKEN } from "../lib/constants.js";

// Initialize the bot
export const bot = new Telegraf(BOT_TOKEN, {
    telegram: { webhookReply: true },
});