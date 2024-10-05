/**
 * start - Start the bot and receive a welcome message
health_check - Check if the bot is running properly
help - Display a list of available commands
edit_serv_state_help - Display command guide for /edit_serv_state
serv_state - View the current service state of vehicles and chargers
edit_serv_state - Start a session to edit the service state of vehicles or chargers
send_full_list - Get a complete list of all vehicles and chargers
show_wpt - Display the current WPT list
add_driven - Start a session to update vehicles driven for the week
reset_driven - Reset the driven status of all vehicles for the week
cancel - Cancel any ongoing command session
 */

export const ONLY_VOR_REMINDER =
  "REMINDER: This option will only work for vehicles that are already VOR in Serv State";

export const ONLY_SVC_REMINDER =
  "REMINDER: This option will only work for vehicles that are already SVC in Serv State";

export const VOR_TO_SVC_INSTRUCTIONS =
  "Please type the vehicles/chargers you wish to move from VOR to SVC in a list, each item should be separated by a comma\nExample: 46087, 46088, 51000";

export const UPDATE_DRIVEN_INSTRUCTIONS =
  "Please type the vehicles you wish update to be driven this week, each item should be separated by a comma\nExample: 46087, 46088, 51000";

export const MULTILINE_INPUT_INSTRUCTIONS =
  "Each entry should be on a separate line and follow the exact format below:\n\n" +
  "item_number | VOR_reason | date_reported\n\n" +
  "Example:\n" +
  "51000 | Engine Overhaul | 15/09/2023\n" +
  "46086 | Brake Replacement | 20/09/2023\n" +
  "642-2005L | Electrical System Check | 22/09/2023\n\n" +
  "Important Guidelines:\n\n" +
  "1. One Entry Per Line:\n" +
  "- Each vehicle or charger and its corresponding VOR information must be entered on a new line.\n\n" +
  "2. Format Specification:\n" +
  "- Use the format: item_number | VOR_reason | date_reported\n" +
  "- Example: 51000 | Engine Overhaul | 15/09/2023\n\n" +
  "3. Handling Multiple VOR Reasons:\n" +
  "- If a vehicle or charger has multiple VOR reasons reported on different dates, enter each reason on a separate line.\n\n" +
  "Example for Multiple VOR Reasons:\n" +
  "51000 | Engine Overhaul | 15/09/2023\n" +
  "51000 | Brake Replacement | 18/09/2023\n\n" +
  "4. Date Formatting:\n" +
  "- The date must be in the format DD/MM/YYYY.\n" +
  "- Strictly adhere to this format to ensure consistency and accuracy.\n\n" +
  "5. Allowed Characters:\n" +
  "- Ensure that vehicle or charger numbers (e.g., 51000, 46086, 642-2005L) are entered exactly as provided.\n" +
  "- VOR reasons should be concise and descriptive (e.g., Engine Overhaul, Brake Replacement).\n\n" +
  "Complete Example with Multiple Entries:\n" +
  "51000 | Engine Overhaul | 15/09/2023\n" +
  "46086 | Brake Replacement | 20/09/2023\n" +
  "642-2005L | Electrical System Check | 22/09/2023\n" +
  "51000 | Fuel System Inspection | 25/09/2023\n\n" +
  "Summary:\n" +
  "- Each entry on a new line\n" +
  "- Format: item_number | VOR_reason | date_reported\n" +
  "- Date format: DD/MM/YYYY\n" +
  "- Multiple reasons for the same item should be on separate lines";

export const MULTILINE_INVALID_INPUT_REMINDER =
  "⚠️ **Invalid Input Detected** ⚠️\n\n" +
  "We've noticed that some of your entries do not follow the required format. Please ensure that each line adheres to the following structure:\n\n" +
  "`item_number | VOR_reason | date_reported`\n\n" +
  "**Common Issues:**\n\n" +
  "1. **Missing Separator:** (`|`).\n" +
  "   - ❌ *Invalid:* `51000 | Engine Overhaul 15/09/2023`\n" +
  "   - ✅ *Valid:* `51000 | Engine Overhaul | 15/09/2023`\n\n" +
  "2. **Incorrect Date Format:** The date must be in the format `DD/MM/YYYY`.\n" +
  "   - ❌ *Invalid:* `46086 | Brake Replacement | 2023/09/20`\n" +
  "   - ✅ *Valid:* `46086 | Brake Replacement | 20/09/2023`\n\n" +
  "3. **Extra or Missing Information:** Each entry should have exactly three parts separated by (`|`).\n" +
  "   - ❌ *Invalid:* `642-2005L | Electrical System Check`\n" +
  "   - ✅ *Valid:* `642-2005L | Electrical System Check | 22/09/2023`\n\n";

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

export const HELP_MESSAGE = `
*Welcome to the FM Helper Bot!*

Here are the commands you can use:

---

🔹 *Basic Commands:*
- \`/start\`  
  _Start the bot and receive a welcome message._

- \`/health_check\`  
  _Check if the bot is running properly._

- \`/help\`  
  _Display this help message._

---

🔹 *Service State Commands:*
- \`/serv_state\`  
  _View the current service state of vehicles and chargers._

- \`/edit_serv_state\`  
  _Start a session to edit the service state of vehicles or chargers._  
  _*Options*_
  1. *Move Vehicle/Charger from VOR to SVC*  
     _Transfer items to SVC status._

  2. *Move Vehicle/Charger to VOR*  
     _Transfer items to VOR status with reasons and dates._

  3. *Update VOR Information of Vehicle/Charger*  
     _Modify existing VOR reasons by replacing or appending._

- \`/send_full_list\`  
  _Get a complete list of all vehicles and chargers._

---

🔹 *WPT (Weekly Planned Tasks) Commands:*
- \`/show_wpt\`  
  _Display the current Weekly Planned Tasks._

- \`/add_driven\`  
  _Start a session to update the list of vehicles driven for the week._  
  _*Usage*: Follow the on-screen instructions to add driven vehicles._

- \`/reset_driven\`  
  _Reset the driven status of all vehicles._  
  _*Note*: This will mark all vehicles as undriven._

---

🔹 *Utility Commands:*
- \`/cancel\`  
  _Cancel any ongoing command session._

---

*💡 Tips:*
- **Starting a Command Session:** Some commands like \`/edit_serv_state\` and \`/add_driven\` initiate a multi-step process. Follow the prompts carefully to complete these actions.
- **Canceling a Session:** If you need to stop any ongoing process, simply use the \`/cancel\` command.
- **Input Formats:** Ensure that your inputs follow the required formats, especially for commands that require specific data entries.

---

For detailed instructions on the \`/edit_serv_state\` command, use the following command:

\`\`\`
/edit_serv_state_help
\`\`\`

*For any further assistance, feel free to reach out to 96305601!*
    `;

export const EDIT_SERV_STATE_HELP = `
# \`/edit_serv_state\` Command Guide

The /edit_serv_state command allows you to manage the service state of vehicles and chargers through a multi-step interactive process.

**Options**

1. **Move Vehicle/Charger from VOR to SVC**
   - **Description:** Transfer items from VOR to SVC status.
   - **Input:** Comma-separated list (e.g., \`46088, 46089, 642-2005L\`)

2. **Move Vehicle/Charger from SVC to VOR**
   - **Description:** Assign items to VOR status with reasons and dates.
   - **Input Format:**
     \`\`\`
     item_number | VOR_reason | date_reported (DD/MM/YYYY)
     \`\`\`
     **Example:**
     \`\`\`
     46091 | Maintenance | 01/10/2024
     642-2005L | Upgrade | 02/10/2024
     \`\`\`

3. **Update VOR Information of Vehicle/Charger**
   - **Sub-Options:**
     - **Replace Entire VOR Reason**
       - **Description:** Replace existing VOR reasons.
       - **Input Format:**
         \`\`\`
         item_number | new_VOR_reason | new_date_reported (DD/MM/YYYY)
         \`\`\`
         **Example:**
         \`\`\`
         46091 | Emergency Repair | 03/10/2024
         642-2005L | Maintenance | 04/10/2024
         \`\`\`
     - **Append VOR Reasons**
       - **Description:** Add new VOR reasons to existing ones.
       - **Input Format:**
         \`\`\`
         item_number | additional_VOR_reason | additional_date_reported (DD/MM/YYYY)
         \`\`\`
         **Example:**
         \`\`\`
         46092 | Battery Check | 05/10/2024
         642-2005L | Firmware Patch | 06/10/2024
         \`\`\`

For more detailed instructions, refer to the \`/edit_serv_state\` command guide.
`;