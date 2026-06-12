import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import {
  CommentModel,
  CommunityModel,
  CommunityRequestModel,
  EventModel,
  MembershipRequestModel,
  NotificationModel,
  PostModel,
  ReportModel,
  UserModel
} from "./schemas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEED_PATH = path.join(__dirname, "db.json");

const collections = [
  ["users", UserModel],
  ["communities", CommunityModel],
  ["posts", PostModel],
  ["comments", CommentModel],
  ["events", EventModel],
  ["notifications", NotificationModel],
  ["communityRequests", CommunityRequestModel],
  ["membershipRequests", MembershipRequestModel],
  ["reports", ReportModel]
];

let connectionPromise;

async function readSeedFile() {
  const raw = await readFile(SEED_PATH, "utf8");
  return JSON.parse(raw);
}

async function seedDatabaseIfEmpty() {
  const userCount = await UserModel.countDocuments();

  if (userCount > 0) {
    return;
  }

  const seed = await readSeedFile();

  for (const [key, model] of collections) {
    if (seed[key]?.length) {
      await model.insertMany(seed[key]);
    }
  }
}

export async function connectDb() {
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.mongodbUri).then(async (connection) => {
      await seedDatabaseIfEmpty();
      return connection;
    });
  }

  return connectionPromise;
}

function cloneRecord(document) {
  const record = JSON.parse(JSON.stringify(document));

  if (!record.id && record._id) {
    record.id = String(record._id);
  }

  return record;
}

export async function readDb() {
  await connectDb();

  const entries = await Promise.all(
    collections.map(async ([key, model]) => {
      const documents = await model.find({}).lean();
      return [key, documents.map(cloneRecord)];
    })
  );

  return Object.fromEntries(entries);
}

async function replaceCollection(model, documents) {
  await model.deleteMany({});

  if (documents.length > 0) {
    await model.insertMany(documents);
  }
}

export async function writeDb(data) {
  await connectDb();

  for (const [key, model] of collections) {
    await replaceCollection(model, data[key] || []);
  }

  return data;
}

export async function updateDb(mutator) {
  const db = await readDb();
  const result = await mutator(db);

  if (!result?.error) {
    await writeDb(db);
  }

  return result;
}

export function nextId(prefix, items) {
  const numericIds = items
    .map((item) => {
      const rawId = item.id || item._id || "";
      return Number.parseInt(String(rawId).replace(prefix, ""), 10);
    })
    .filter((value) => Number.isFinite(value));
  const next = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
  return `${prefix}${next}`;
}
