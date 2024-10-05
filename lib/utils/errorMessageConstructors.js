import { botSendMessage } from "../../botController/botCommandFunctions.js";

export function DataFetchingError(target) {
  return `An error has occured on the server trying to retrieve information on ${target}. Please contact 96305601 regarding this to fix this issue.`;
}

export function InvalidLinesError(invalidLines) {
  return `Invalid items:\n\n${invalidLines.join("\n")}`;
}

export function DataMutationError(target) {
  return `An error has occured on the server trying to update information for ${target} in the database. Please contact 96305601 regarding this to fix this issue.`;
}

export function handleError(ctx, error, message) {
  console.error(error);
  return botSendMessage(ctx, message, "error");
}
