import { format } from "date-fns";

const exampleWithDuplicateVehiclesAndVORReason =
  "Example:\n46086 - Wheel burst - 28/12/2004\n51012 - Low battery - 01/01/2004\n50701 - Cannot start - 12/09/2015";

export function getCurrentDateInSingapore() {
  // Create a new Date object
  const now = new Date();

  // Create an Intl.DateTimeFormat object with Singapore timezone
  const options = {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const formatter = new Intl.DateTimeFormat("en-GB", options);

  // Format the date
  const parts = formatter.formatToParts(now);
  const day = parts.find((part) => part.type === "day").value;
  const month = parts.find((part) => part.type === "month").value;
  const year = parts.find((part) => part.type === "year").value;

  // Return the formatted date as DD-MM-YYYY
  return `${day}-${month}-${year}`;
}

export function convertDateFormat(dateString) {
  const [day, month, year] = dateString.split("/");
  return `${year}-${month}-${day}`;
}

/**
 * Formats a single charger's VOR information.
 *
 * @param {Object} charger - The charger object.
 * @returns {string} - The formatted charger line.
 */
export function formatChargerLine(charger) {
  const { charger_num, charger_loc, charger_vor_reason } = charger;
  const vorText = charger_vor_reason
    .map((vor_reason) => {
      return `${vor_reason.vor_reason}${
        vor_reason.date_reported ? ` (${vor_reason.date_reported})` : ""
      }`;
    })
    .join(" ");
  return `${charger_num}(VOR) / ${charger_loc} - ${vorText}`;
}

/**
 * Formats a single vehicle's VOR information.
 *
 * @param {Object} vehicle - The vehicle object.
 * @returns {string} - The formatted vehicle line.
 */
export function formatVehicleLine(vehicle) {
  const { vec_num, vehicle_vor_reason } = vehicle;
  const vorText = vehicle_vor_reason
    .map((vor_reason) => {
      return `${vor_reason.vor_reason}${
        vor_reason.date_reported ? ` (${vor_reason.date_reported})` : ""
      }`;
    })
    .join(" ");
  return `${vec_num}(VOR) - ${vorText}`;
}

/**
 * Formats a VOR section for the service state message.
 *
 * @param {Object} dataGroupedByType - The data grouped by type (vehicle or charger).
 * @param {Object} countData - The count data for each type.
 * @param {Function} formatItemLine - A function to format each item's line.
 * @returns {string} - The formatted VOR section string.
 */
export function formatServStateSection(
  dataGroupedByType,
  countData,
  formatItemLine
) {
  let section = "";
  // console.log(countData);
  
  for (const type in dataGroupedByType) {
    const items = dataGroupedByType[type];
    // console.log(type);
    // console.log(countData[type])
    const { total, required } = countData[type];

    
    section += `\n\n${type} (${
      total - items.length
    }/${total}) [OPS REQUIREMENT: ${required}]\n`;

    items.forEach((item) => {
      section += `${formatItemLine(item)}\n`;
    });

    section += "_________\n";
  }

  return section;
}

/**
 * Groups an array of items by their 'type' property.
 *
 * @param {Array} items - The array of items to group.
 * @param {Array} types - The list of all possible types.
 * @returns {Object} - An object with types as keys and arrays of items as values.
 */
export function groupItemsByType(items, types) {
  const grouped = {};
  types.forEach((type) => {
    grouped[type] = items.filter((item) => item.type === type);
  });
  return grouped;
}

export function formatWPTSections(title, groupedVehicleData, types) {
  let section = `\n${title}:\n`;

  types.forEach((type) => {
    const vehicles = groupedVehicleData[type];
    if (vehicles.length > 0) {
      const vehicleList = vehicles.map((vec) => vec.vec_num).join(", ");
      section += `\n${type}: ${vehicleList}\n`;
    } else {
      section += `\n${type}: NIL\n`;
    }
  });

  return section;
}

export function formatDate(date) {
  return date ? format(new Date(date), "dd-MM-yyyy") : null;
}

export function constructBotMessage(username, message, type = "normal") {
  switch (type) {
    case "error":
      return `@${username}\nError: ${message}`;
    case "markdown":
      return `@${username}\n${message}`;
    default:
      return `@${username}\n${message}`;
  }
}
