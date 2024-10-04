export function DataFetchingError(target) {
    return `An error has occured on the server trying to retrieve information on ${target}. Please contact 96305601 regarding this to fix this issue.`
}

export function InvalidLinesError(invalidLines){
    return `Invalid items: ${invalidLines.join(", ")}`
}

export function DataMutationError(target){
    return `An error has occured on the server trying to update information for ${target} in the database. Please contact 96305601 regarding this to fix this issue.`
}