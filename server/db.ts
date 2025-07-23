import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/your-db-name";

if (!uri) {
  throw new Error(
    "MONGODB_URI must be set. Did you forget to provide a MongoDB connection string?"
  );
}

export const client = new MongoClient(uri);

export async function connectToDatabase() {
  // MongoClient.connect() is safe to call multiple times in v4+
  await client.connect();
  return client.db(); // Returns the default database from the URI
}