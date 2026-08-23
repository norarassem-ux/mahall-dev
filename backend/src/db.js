// Data-access layer. Everything above this module talks in terms of
// venues / users / inquiries, never in terms of the storage engine.
// Set DB_DRIVER=oracle (see .env.example) to talk to the local Oracle
// DB through ORDS instead of the offline JSON file.
import { jsonStore } from "./stores/jsonStore.js";
import { oracleStore } from "./stores/oracleStore.js";

export const db = process.env.DB_DRIVER === "oracle" ? oracleStore : jsonStore;
