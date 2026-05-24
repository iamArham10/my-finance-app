import fs from "fs";
import path from "path";
import { Folder, Item, Profile } from "@/types";
import { randomUUID } from "crypto";

const DB_PATH = path.join(process.cwd(), "data.json");

interface Database {
  profiles: Profile[];
  folders: Folder[];
  items: Item[];
}

const defaultDb: Database = {
  profiles: [{
    id: "local_user_1",
    email: "local@example.com",
    full_name: "Local User",
    created_at: new Date().toISOString()
  }],
  folders: [],
  items: [],
};

function readDb(): Database {
  if (!fs.existsSync(DB_PATH)) {
    writeDb(defaultDb);
    return defaultDb;
  }
  const data = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(data);
}

function writeDb(db: Database) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export const localDb = {
  read: readDb,
  write: writeDb,
  generateId: () => randomUUID(),
};
