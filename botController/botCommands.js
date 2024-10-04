import { botSendMessage, editServStateStep1, editServStateStep2, editServStateStep3, sendServState, sendWPT } from "./botCommandFunctions";

export function addBotCommands(bot) {
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
    return sendServState(ctx);
  });

  bot.command("show_wpt", async (ctx) => {
    if (ctx.session.state != "idle") {
      return botSendMessage(
        ctx,
        `Unable to send WPT list, you are still in a command session for /${ctx.session.cur_command}. If you wish to terminate the command, please enter /cancel`
      );
    }
    return sendWPT(ctx);
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
    await sendFullList(ctx);
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
}