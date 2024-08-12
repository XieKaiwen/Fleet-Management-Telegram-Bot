// TODO input validation checking and input parsing into an object (for the multi-row inputs)

import {
  getAllChargers,
  getAllVehicles,
  getAllVORChargers,
  getAllVORVehicles,
} from "./retrieveDataUtils.js";

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
function convertDateFormat(dateString) {
  const [day, month, year] = dateString.split("/");
  return `${year}-${month}-${day}`;
}

export async function validateRowsWithItemVORReasonDate(itemEntries, isAllVOR) {
  // itemEntries should be the splitted version of the text, an array of entries ["item_num - reason - date", "..."]
  // This function should return an invalidLines array
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
  let invalidLines = [];

  itemEntries.forEach((line) => {
    const lineParts = line.split(" - ");
    if (lineParts.length !== 3) {
      invalidLines.push(line);
      return;
    }
    const [itemNum, vorReason, date] = lineParts;
    if(!allItemsNumbers.vehicles.includes(itemNum) && !allItemsNumbers.chargers.includes(itemNum)){
        invalidLines.push(line)
        return
    }
    if(!/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/.test(date)){
        invalidLines.push(line)
        return
    }
  });
  return {invalidLines, allItemsNumbers}
}

export function parseRowsWithItemVORReasonDate(itemEntries, allItemsNumbers) {
  const itemsAppendObject = {
    vehicles: {},
    chargers: {}
  }

  itemEntries.forEach((item) => {
    const [itemNum, vorReason, date] = item.split(" - ")
    if(allItemsNumbers.vehicles.includes(itemNum)){
      if (!itemsAppendObject.vehicles[itemNum]) {
        itemsAppendObject.vehicles[itemNum] = []
      }
      itemsAppendObject.vehicles[itemNum].push({dateReported: convertDateFormat(date), vorReason: vorReason})
    }else if(allItemsNumbers.chargers.includes(itemNum)){
      if (!itemsAppendObject.chargers[itemNum]) {
        itemsAppendObject.chargers[itemNum] = []
      }
      itemsAppendObject.chargers[itemNum].push({dateReported: convertDateFormat(date), vorReason: vorReason})
    }
  })
  return itemsAppendObject

}
