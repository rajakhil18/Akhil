import { users, documents, ocrResults, type User, type InsertUser, type Document, type InsertDocument, type OcrResult, type InsertOcrResult } from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getDocuments(limit?: number, offset?: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  searchDocuments(query: string): Promise<Document[]>;
  
  // OCR Result methods
  getOcrResult(documentId: number): Promise<OcrResult | undefined>;
  createOcrResult(ocrResult: InsertOcrResult): Promise<OcrResult>;
  
  // Analytics methods
  getDocumentStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    avgConfidence: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getDocuments(limit = 50, offset = 0): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .orderBy(desc(documents.uploadedAt))
      .limit(limit)
      .offset(offset);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  async searchDocuments(query: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(
        or(
          ilike(documents.originalName, `%${query}%`),
          ilike(documents.documentType, `%${query}%`)
        )
      )
      .orderBy(desc(documents.uploadedAt));
  }

  async getOcrResult(documentId: number): Promise<OcrResult | undefined> {
    const [result] = await db
      .select()
      .from(ocrResults)
      .where(eq(ocrResults.documentId, documentId));
    return result || undefined;
  }

  async createOcrResult(insertOcrResult: InsertOcrResult): Promise<OcrResult> {
    const [result] = await db
      .insert(ocrResults)
      .values(insertOcrResult)
      .returning();
    return result;
  }

  async getDocumentStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    avgConfidence: number;
  }> {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(case when status = 'pending' then 1 end)::int`,
        processing: sql<number>`count(case when status = 'processing' then 1 end)::int`,
        completed: sql<number>`count(case when status = 'completed' then 1 end)::int`,
        failed: sql<number>`count(case when status = 'failed' then 1 end)::int`,
        avgConfidence: sql<number>`avg(confidence_score)::int`,
      })
      .from(documents);
    
    return stats;
  }
}

export const storage = new DatabaseStorage();
