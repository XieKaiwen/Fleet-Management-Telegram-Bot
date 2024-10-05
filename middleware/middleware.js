import { botSendMessage } from "../botController/botCommandFunctions.js";

const sessionStore = {}

export function botSessionMiddleware(ctx, next) {
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
  if (ctx.message?.text) {
    ctx.message.text = ctx.message?.text.trim();
  } else if (ctx.edited_message?.text) {
    ctx.edited_message.text = ctx.edited_message?.text.trim();
  }

  console.log("CTX message: ", ctx.message?.text);
  console.log("CTX editted message: ", ctx.edited_message?.text);
  // Proceed with the middleware chain
  return next();
}

export function botCheckSessionMiddleware(ctx, next) {
  if (ctx.session.state == "idle" || ctx.message?.text.startsWith("/cancel")) {
    return next();
  } else {
    if (ctx.message?.text.startsWith("/") && ctx.session.cur_command) {
      return botSendMessage(
        ctx,
        `Unable to perform ${ctx.message.text}, you are still in a command session for /${ctx.session.cur_command}. If you wish to terminate the command, please enter /cancel.`
      );
    }
    return next()
  }
}

export function restartCtxSession(ctx) {
  // console.log(ctx.session.state);
  ctx.session.state = "idle";
  ctx.session.cur_command = null;
  ctx.session.cur_step = null;
  ctx.session.input = {};
}
