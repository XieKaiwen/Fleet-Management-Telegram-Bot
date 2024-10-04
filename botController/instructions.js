export const ONLY_VOR_REMINDER =
  "REMINDER: This option will only work for vehicles that are already VOR in Serv State";

export const ONLY_SVC_REMINDER =
  "REMINDER: This option will only work for vehicles that are already SVC in Serv State";

export const VOR_TO_SVC_INSTRUCTIONS =
  "Please type the vehicles/chargers you wish to move from VOR to SVC in a list, each item should be separated by a comma\nExample: 46087, 46088, 51000";

export const MULTILINE_INPUT_INSTRUCTIONS =
  "Each entry should be on a separate line and follow the exact format below:\n\n" +
  "item_number - VOR_reason - date_reported\n\n" +
  "Example:\n" +
  "51000 - Engine Overhaul - 15/09/2023\n" +
  "46086 - Brake Replacement - 20/09/2023\n" +
  "642-2005L - Electrical System Check - 22/09/2023\n\n" +
  "Important Guidelines:\n\n" +
  "1. One Entry Per Line:\n" +
  "- Each vehicle or charger and its corresponding VOR information must be entered on a new line.\n\n" +
  "2. Format Specification:\n" +
  "- Use the format: item_number - VOR_reason - date_reported\n" +
  "- Example: 51000 - Engine Overhaul - 15/09/2023\n\n" +
  "3. Handling Multiple VOR Reasons:\n" +
  "- If a vehicle or charger has multiple VOR reasons reported on different dates, enter each reason on a separate line.\n\n" +
  "Example for Multiple VOR Reasons:\n" +
  "51000 - Engine Overhaul - 15/09/2023\n" +
  "51000 - Brake Replacement - 18/09/2023\n\n" +
  "4. Date Formatting:\n" +
  "- The date must be in the format DD/MM/YYYY.\n" +
  "- Strictly adhere to this format to ensure consistency and accuracy.\n\n" +
  "5. Allowed Characters:\n" +
  "- Ensure that vehicle or charger numbers (e.g., 51000, 46086, 642-2005L) are entered exactly as provided.\n" +
  "- VOR reasons should be concise and descriptive (e.g., Engine Overhaul, Brake Replacement).\n\n" +
  "Complete Example with Multiple Entries:\n" +
  "51000 - Engine Overhaul - 15/09/2023\n" +
  "46086 - Brake Replacement - 20/09/2023\n" +
  "642-2005L - Electrical System Check - 22/09/2023\n" +
  "51000 - Fuel System Inspection - 25/09/2023\n\n" +
  "Summary:\n" +
  "- Each entry on a new line\n" +
  "- Format: item_number - VOR_reason - date_reported\n" +
  "- Date format: DD/MM/YYYY\n" +
  "- Multiple reasons for the same item should be on separate lines";

export const MULTILINE_INVALID_INPUT_REMINDER =
  "⚠️ **Invalid Input Detected** ⚠️\n\n" +
  "We've noticed that some of your entries do not follow the required format. Please ensure that each line adheres to the following structure:\n\n" +
  "`item_number - VOR_reason - date_reported`\n\n" +
  "**Common Issues:**\n\n" +
  "1. **Missing Hyphens:** Ensure that there are spaces before and after each hyphen (`-`).\n" +
  "   - ❌ *Invalid:* `51000 - Engine Overhaul 15/09/2023`\n" +
  "   - ✅ *Valid:* `51000 - Engine Overhaul - 15/09/2023`\n\n" +
  "2. **Incorrect Date Format:** The date must be in the format `DD/MM/YYYY`.\n" +
  "   - ❌ *Invalid:* `46086 - Brake Replacement - 2023/09/20`\n" +
  "   - ✅ *Valid:* `46086 - Brake Replacement - 20/09/2023`\n\n" +
  "3. **Extra or Missing Information:** Each entry should have exactly three parts separated by hyphens.\n" +
  "   - ❌ *Invalid:* `642-2005L - Electrical System Check`\n" +
  "   - ✅ *Valid:* `642-2005L - Electrical System Check - 22/09/2023`\n\n";

export const INVALID_ITEM_ERROR_REMINDER =
  "Please check if these vehicle/charger numbers you have entered are valid.";

export const INVALID_ITEM_ERROR_REMINDER_ALL_VOR =
  INVALID_ITEM_ERROR_REMINDER +
  "All vehicles/chargers entered for this command should be VOR.";
export const INVALID_ITEM_ERROR_REMINDER_ALL_SVC =
  INVALID_ITEM_ERROR_REMINDER +
  "All vehicles/chargers entered for this command should be SVC.";

export function constructMultilineInstructions(title) {
  return title + "\n" + MULTILINE_INPUT_INSTRUCTIONS;
}