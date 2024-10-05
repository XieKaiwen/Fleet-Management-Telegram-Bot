import {
  DataFetchingError,
  handleError,
} from "../lib/utils/errorMessageConstructors.js";
import { restartCtxSession } from "../middleware/middleware.js";
import prisma from "../prisma-client/prisma.js";
import {
  botSendMessage,
  editServStateStep1,
  editServStateStep2,
  editServStateStep3,
  sendFullList,
  sendServState,
  sendUpdateDrivenVehicleInstructions,
  sendWPT,
  updateDrivenVehicles,
} from "./botCommandFunctions.js";
import { EDIT_SERV_STATE_HELP, HELP_MESSAGE } from "./instructions.js";

export function addBotCommands(bot) {
  bot.command("start", (ctx) => {
    console.log(ctx.from);
    // ctx.session.state = 'idle'
    // ctx.session.cur_command = null
    return botSendMessage(ctx, "Hello there! I am the FM helper bot.");
  });

  bot.command("health_check", (ctx) => {
    return botSendMessage(ctx, "Health OK. Bot is up and functional");
  });

  bot.command("serv_state", async (ctx) => {
    return sendServState(ctx);
  });

  bot.command("show_wpt", async (ctx) => {
    return sendWPT(ctx);
  });

  bot.command("edit_serv_state", async (ctx) => {
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
    const command = ctx.session.cur_command;
    restartCtxSession(ctx);
    return botSendMessage(
      ctx,
      `Existing command session for /${command} has been cleared. You can enter a new command now!`
    );
  });

  bot.command("send_full_list", async (ctx) => {
    return sendFullList(ctx);
  });

  bot.command("add_driven", async (ctx) => {
    ctx.session.state = "in_command";
    ctx.session.cur_command = "add_driven";
    ctx.session.cur_step = 1;
    await botSendMessage(
      ctx,
      "You have started a session to update vehicles driven for the week! Please follow the following instructions..."
    );
    return sendUpdateDrivenVehicleInstructions(ctx);
  });

  bot.command("reset_driven", async (ctx) => {
    try {
      await prisma.vehicles.setAllVehiclesUndriven();
      try {
        await sendWPT(ctx);
      } catch (err) {
        handleError(ctx, err, DataFetchingError("fetching WPT list"));
      }
    } catch (err) {
      handleError(ctx, err, DataMutationError("resetting vehicles driven"));
    }
  });

  bot.command("help", async (ctx) => {
    return botSendMessage(ctx, HELP_MESSAGE, "markdown");
  });
  bot.command("edit_serv_state_help", async (ctx) => {
    return botSendMessage(ctx, EDIT_SERV_STATE_HELP, "markdown");
  });
  // Handling undefined commands
  bot.on("message", async (ctx) => {
    if (ctx.message?.text.startsWith("/")) {
      return botSendMessage(
        ctx,
        "Sorry, I didn’t recognize that command. Type /help for a list of available commands."
      );
    }
    const text = ctx.message?.text;
    switch (ctx.session.cur_command) {
      case "edit_serv_state":
        if (ctx.session.cur_step === 1) {
          await editServStateStep1(ctx, text);
        } else if (ctx.session.cur_step === 2) {
          await editServStateStep2(ctx, text);
        } else if (ctx.session.cur_step === 3) {
          await editServStateStep3(ctx, text); // only update VOR reason has a step 3
        }
        break;
      case "add_driven":
        if (ctx.session.cur_step === 1) {
          await updateDrivenVehicles(ctx, text);
        }
      default:
        // await botSendMessage(ctx, "Irrelevant message. Please type in a command");
        break;
    }
  });
  // TODO updateVehicleDriven command, with node scheduler
}
