// TODO input validation checking and input parsing into an object (for the multi-row inputs)

import {
  getAllChargers,
  getAllSVCChargers,
  getAllSVCVehicles,
  getAllVehicles,
  getAllVORChargers,
  getAllVORVehicles,
} from "./retrieveDataUtils.js";


export function convertDateFormat(dateString) {
  const [day, month, year] = dateString.split("/");
  return `${year}-${month}-${day}`;
}

export function separateItemInInputByComma(input){
  const itemList = input.split(",").map(part => part.trim());
  itemList.forEach((item) => {
    item.trim();
  })
  return itemList
}


export async function validateCommaSeparatedItems(itemList, isAllVOR) {
  // This function is for commands like VOR to SVC where the user has a comma separated list of items as input
  const allVehicles = isAllVOR
    ? await getAllVORVehicles()
    : await getAllVehicles();
  const allChargers = isAllVOR
    ? await getAllVORChargers()
    : await getAllChargers();
  const allItemsNumbers = {
    vehicles: allVehicles.map((v) => v.vec_num),
    chargers: allChargers.map((c) => c.charger_num),
  };
  
  const invalidItems = [];
  itemList.forEach((item) => {
    if (!allItemsNumbers.vehicles.includes(item) && !allItemsNumbers.chargers.includes(item)) {
      invalidItems.push(item)
    }
  })
  return {invalidItems, allItemsNumbers}
}

export function parseCommaSeparatedItems(itemList, allItemsNumbers){
  const itemsAppendObject = {
    vehicles: [],
    chargers: [],
  };
  
  itemList.forEach((item) => {
    if(allItemsNumbers.vehicles.includes(item)) {
      itemsAppendObject.vehicles.push(item);
    }else if(allItemsNumbers.chargers.includes(item)) {
      itemsAppendObject.chargers.push(item);
    }
  })
  return itemsAppendObject
}
/* 
Objects returned should look like this 
{
    vehicles:{ 
        v1 : [
            {dateReported: , vorReason: },
        ]
    }
    
    chargers: {
        c1 : [
            {dateReported: , vorReason: },
        ]
    }

}
*/
export function parseRowsWithItemVORReasonDate(itemEntries, allItemsNumbers) {
  const itemsAppendObject = {
    vehicles: {},
    chargers: {},
  };

  itemEntries.forEach((item) => {
    const [itemNum, vorReason, date] = item.split("|").map(part => part.trim());
    
    if (allItemsNumbers.vehicles.includes(itemNum)) {
      if (!itemsAppendObject.vehicles[itemNum]) {
        itemsAppendObject.vehicles[itemNum] = [];
      }
      itemsAppendObject.vehicles[itemNum].push({
        dateReported: convertDateFormat(date),
        vorReason: vorReason,
      });
    } else if (allItemsNumbers.chargers.includes(itemNum)) {
      if (!itemsAppendObject.chargers[itemNum]) {
        itemsAppendObject.chargers[itemNum] = [];
      }
      itemsAppendObject.chargers[itemNum].push({
        dateReported: convertDateFormat(date),
        vorReason: vorReason,
      });
    }
  });
  return itemsAppendObject;
}

export async function validateRowsWithItemVORReasonDate(itemEntries, isAllVOR = false, isAllSVC = false) {
  // itemEntries should be the splitted version of the text, an array of entries ["item_num | reason | date", "..."]
  // This function should return an invalidLines array
  const allVehicles = isAllVOR
    ? await getAllVORVehicles()
    : (isAllSVC ? await getAllSVCVehicles() :await getAllVehicles());
  const allChargers = isAllVOR
    ? await getAllVORChargers()
    : (isAllSVC? await getAllSVCChargers() : await getAllChargers());

  const allItemsNumbers = {
    vehicles: allVehicles.map((v) => v.vec_num),
    chargers: allChargers.map((c) => c.charger_num),
  };
  const invalidLines = [];

  itemEntries.forEach((line) => {
    const lineParts = line.split("|").map(part => part.trim());
    console.log(lineParts);
    
    if (lineParts.length !== 3) {
      invalidLines.push(line);
      
      return;
    }
    const [itemNum, vorReason, date] = lineParts;
    if (
      !allItemsNumbers.vehicles.includes(itemNum) &&
      !allItemsNumbers.chargers.includes(itemNum)
    ) {
      invalidLines.push(line);
      return;
    }
    if (
      !/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/.test(date)
    ) {
      invalidLines.push(line);
    }
  });
  return { invalidLines, allItemsNumbers };
}
