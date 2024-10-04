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

export function restartCtxSession(ctx) {
  // console.log(ctx.session.state);
  ctx.session.state = "idle";
  ctx.session.cur_command = null;
  ctx.session.cur_step = null;
  ctx.session.input = {};
}
