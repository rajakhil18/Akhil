import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  filePath: text("file_path").notNull(),
  documentType: text("document_type").notNull(), // certificate, resume, license, etc.
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  confidenceScore: integer("confidence_score"), // 0-100
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  userId: integer("user_id"), // optional for now
});

export const ocrResults = pgTable("ocr_results", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  extractedText: text("extracted_text").notNull(),
  structuredData: jsonb("structured_data"), // JSON object with extracted fields
  boundingBoxes: jsonb("bounding_boxes"), // OCR bounding box data
  confidenceScore: integer("confidence_score").notNull(),
  processingTime: integer("processing_time"), // in milliseconds
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documentRelations = relations(documents, ({ one, many }) => ({
  ocrResults: many(ocrResults),
}));

export const ocrResultsRelations = relations(ocrResults, ({ one }) => ({
  document: one(documents, {
    fields: [ocrResults.documentId],
    references: [documents.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
  processedAt: true,
});

export const insertOcrResultSchema = createInsertSchema(ocrResults).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertOcrResult = z.infer<typeof insertOcrResultSchema>;
export type OcrResult = typeof ocrResults.$inferSelect;
