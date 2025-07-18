import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDocumentSchema, insertOcrResultSchema } from "@shared/schema";
import { ocrService } from "./services/ocrService";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ZodError } from "zod";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get document statistics
  app.get("/api/documents/stats", async (req, res) => {
    try {
      const stats = await storage.getDocumentStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting document stats:", error);
      res.status(500).json({ error: "Failed to get document statistics" });
    }
  });

  // Get all documents
  app.get("/api/documents", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const documents = await storage.getDocuments(limit, offset);
      res.json(documents);
    } catch (error) {
      console.error("Error getting documents:", error);
      res.status(500).json({ error: "Failed to get documents" });
    }
  });

  // Search documents
  app.get("/api/documents/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      const documents = await storage.searchDocuments(query);
      res.json(documents);
    } catch (error) {
      console.error("Error searching documents:", error);
      res.status(500).json({ error: "Failed to search documents" });
    }
  });

  // Get specific document
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error getting document:", error);
      res.status(500).json({ error: "Failed to get document" });
    }
  });

  // Upload document
  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const documentData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        filePath: req.file.path,
        documentType: req.body.documentType || "auto-detect",
        status: "pending" as const,
        confidenceScore: null,
        userId: null,
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(validatedData);

      // Start OCR processing in background
      ocrService.processDocument(document.id).catch(error => {
        console.error(`OCR processing failed for document ${document.id}:`, error);
      });

      res.json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: "Invalid document data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  // Get OCR result for document
  app.get("/api/documents/:id/ocr", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ocrResult = await storage.getOcrResult(id);
      if (!ocrResult) {
        return res.status(404).json({ error: "OCR result not found" });
      }
      res.json(ocrResult);
    } catch (error) {
      console.error("Error getting OCR result:", error);
      res.status(500).json({ error: "Failed to get OCR result" });
    }
  });

  // Retry OCR processing for failed documents
  app.post("/api/documents/:id/retry", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (document.status !== "failed") {
        return res.status(400).json({ error: "Document is not in failed state" });
      }

      // Reset status to pending
      await storage.updateDocument(id, { status: "pending" });

      // Start OCR processing
      ocrService.processDocument(id).catch(error => {
        console.error(`OCR retry failed for document ${id}:`, error);
      });

      res.json({ message: "OCR processing restarted" });
    } catch (error) {
      console.error("Error retrying OCR:", error);
      res.status(500).json({ error: "Failed to retry OCR processing" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Delete file from filesystem
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }

      await storage.deleteDocument(id);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Serve uploaded files
  app.get("/api/files/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    
    res.sendFile(filePath);
  });

  const httpServer = createServer(app);
  return httpServer;
}
