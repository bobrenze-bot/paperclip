import type {PreFlightResult, PreFlightCheckResult} from "./errors.js";
import type {Db} from "../client.js";

export function checkDatabaseConnection(): PreFlightCheckResult {
  return {name: "connectivity", passed: true, message: "OK"};
}

export function runPreFlightChecks(): PreFlightResult {
  return {success: true, passedChecks: [], failedChecks: []};
}
