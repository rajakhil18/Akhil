import { ObjectId } from "mongodb";
import { client } from "./db";
import type { User, InsertUser, Document, InsertDocument, OcrResult, InsertOcrResult } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getDocument(id: number): Promise<Document | undefined>;
  getDocuments(limit?: number, offset?: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  searchDocuments(query: string): Promise<Document[]>;

  getOcrResult(documentId: number): Promise<OcrResult | undefined>;
  createOcrResult(ocrResult: InsertOcrResult): Promise<OcrResult>;

  getDocumentStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    avgConfidence: number;
  }>;
}

function getDb() {
  return client.db(); // Uses default DB from URI
}

export class MongoStorage implements IStorage {
  users = () => getDb().collection<User>("users");
  documents = () => getDb().collection<Document>("documents");
  ocrResults = () => getDb().collection<OcrResult>("ocrResults");

  async getUser(id: number): Promise<User | undefined> {
    const user = await this.users().findOne({ id });
    return user === null ? undefined : user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await this.users().findOne({ username });
    return user === null ? undefined : user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const last = await this.users().find().sort({ id: -1 }).limit(1).toArray();
    const newId = last.length > 0 ? last[0].id + 1 : 1;
    const userWithId = { ...user, id: newId };
    const result = await this.users().insertOne(userWithId as User);
    return { ...userWithId, _id: result.insertedId } as User;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const doc = await this.documents().findOne({ id });
    return doc === null ? undefined : doc;
  }

  async getDocuments(limit = 50, offset = 0): Promise<Document[]> {
    return await this.documents()
      .find({})
      .sort({ uploadedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    // Generate a numeric id (auto-increment simulation)
    const last = await this.documents().find().sort({ id: -1 }).limit(1).toArray();
    const newId = last.length > 0 ? last[0].id + 1 : 1;
    const docWithId = { ...document, id: newId, uploadedAt: new Date() };
    await this.documents().insertOne(docWithId as Document);
    return docWithId as Document;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document> {
    const result = await this.documents().findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" } // or use { returnOriginal: false } if using MongoDB driver < 4.0
    );
    if (!result) throw new Error("Document not found");
    return result;
  }

  async deleteDocument(id: number): Promise<void> {
    await this.documents().deleteOne({ id });
  }

  async searchDocuments(query: string): Promise<Document[]> {
    return await this.documents()
      .find({
        $or: [
          { originalName: { $regex: query, $options: "i" } },
          { documentType: { $regex: query, $options: "i" } }
        ]
      })
      .sort({ uploadedAt: -1 })
      .toArray();
  }

  async getOcrResult(documentId: number): Promise<OcrResult | undefined> {
    const result = await this.ocrResults().findOne({ documentId });
    return result === null ? undefined : result;
  }

  async createOcrResult(ocrResult: InsertOcrResult): Promise<OcrResult> {
    await this.ocrResults().insertOne(ocrResult as OcrResult);
    return ocrResult as OcrResult;
  }

  async getDocumentStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    avgConfidence: number;
  }> {
    const docs = await this.documents().find({}).toArray();
    const total = docs.length;
    const pending = docs.filter(d => d.status === "pending").length;
    const processing = docs.filter(d => d.status === "processing").length;
    const completed = docs.filter(d => d.status === "completed").length;
    const failed = docs.filter(d => d.status === "failed").length;
    const avgConfidence =
      docs.length > 0
        ? Math.round(
            docs
              .filter(d => typeof d.confidenceScore === "number")
              .reduce((sum, d) => sum + (d.confidenceScore || 0), 0) /
              docs.filter(d => typeof d.confidenceScore === "number").length
          )
        : 0;
    return { total, pending, processing, completed, failed, avgConfidence };
  }
}

export const storage = new MongoStorage();