import { createWorker } from "tesseract.js";
import { storage } from "../storage";
import sharp from "sharp";
import path from "path";
import fs from "fs";

class OCRService {
  private worker: any = null;

  async initializeWorker() {
    if (!this.worker) {
      this.worker = await createWorker();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
    }
    return this.worker;
  }

  async processDocument(documentId: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Update document status to processing
      await storage.updateDocument(documentId, { 
        status: "processing",
        processedAt: new Date()
      });

      const document = await storage.getDocument(documentId);
      if (!document) {
        throw new Error("Document not found");
      }

      // Preprocess image if needed
      const processedImagePath = await this.preprocessImage(document.filePath, document.mimeType);
      
      // Initialize OCR worker
      const worker = await this.initializeWorker();
      
      // Perform OCR
      const { data } = await worker.recognize(processedImagePath);
      
      // Calculate confidence score
      const confidenceScore = Math.round(data.confidence);
      
      // Extract structured data based on document type
      const structuredData = this.extractStructuredData(data.text, document.documentType);
      
      // Store OCR results
      await storage.createOcrResult({
        documentId: document.id,
        extractedText: data.text,
        structuredData,
        boundingBoxes: data.words,
        confidenceScore,
        processingTime: Date.now() - startTime,
      });

      // Update document status
      await storage.updateDocument(documentId, {
        status: "completed",
        confidenceScore,
      });

      // Clean up processed image if it's different from original
      if (processedImagePath !== document.filePath) {
        fs.unlinkSync(processedImagePath);
      }

    } catch (error) {
      console.error(`OCR processing failed for document ${documentId}:`, error);
      
      // Update document status to failed
      await storage.updateDocument(documentId, {
        status: "failed",
        confidenceScore: 0,
      });
    }
  }

  private async preprocessImage(filePath: string, mimeType: string): Promise<string> {
    // If it's a PDF, we'd need pdf2pic or similar - for now, handle images only
    if (mimeType === 'application/pdf') {
      // For now, return as-is. In production, you'd convert PDF to image
      return filePath;
    }

    // Preprocess image for better OCR results
    const processedPath = filePath.replace(path.extname(filePath), '_processed.png');
    
    await sharp(filePath)
      .greyscale()
      .normalize()
      .sharpen()
      .png()
      .toFile(processedPath);
    
    return processedPath;
  }

  private extractStructuredData(text: string, documentType: string): any {
    const structuredData: any = {
      documentType,
      extractedFields: {}
    };

    // Basic field extraction based on document type
    switch (documentType) {
      case 'certificate':
        structuredData.extractedFields = this.extractCertificateFields(text);
        break;
      case 'resume':
        structuredData.extractedFields = this.extractResumeFields(text);
        break;
      case 'license':
        structuredData.extractedFields = this.extractLicenseFields(text);
        break;
      default:
        // Auto-detect common fields
        structuredData.extractedFields = this.extractCommonFields(text);
    }

    return structuredData;
  }

  private extractCertificateFields(text: string): any {
    const fields: any = {};
    
    // Extract certificate title (usually the first line or contains "Certificate")
    const titleMatch = text.match(/Certificate\s+of\s+[A-Za-z\s]+/i);
    if (titleMatch) {
      fields.title = titleMatch[0].trim();
    }
    
    // Extract name (often after "presented to" or "awarded to")
    const nameMatch = text.match(/(?:presented to|awarded to|this certifies that)\s+([A-Za-z\s]+)/i);
    if (nameMatch) {
      fields.recipientName = nameMatch[1].trim();
    }
    
    // Extract date patterns
    const dateMatch = text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{1,2}-\d{1,2}-\d{4}\b|\b[A-Za-z]+\s+\d{1,2},?\s+\d{4}\b/);
    if (dateMatch) {
      fields.date = dateMatch[0].trim();
    }
    
    return fields;
  }

  private extractResumeFields(text: string): any {
    const fields: any = {};
    
    // Extract email
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) {
      fields.email = emailMatch[0];
    }
    
    // Extract phone number
    const phoneMatch = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
    if (phoneMatch) {
      fields.phone = phoneMatch[0];
    }
    
    // Extract name (usually at the beginning)
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      fields.name = lines[0].trim();
    }
    
    return fields;
  }

  private extractLicenseFields(text: string): any {
    const fields: any = {};
    
    // Extract license number
    const licenseMatch = text.match(/(?:license|lic\.?|no\.?)\s*#?\s*([A-Z0-9]+)/i);
    if (licenseMatch) {
      fields.licenseNumber = licenseMatch[1];
    }
    
    // Extract expiration date
    const expirationMatch = text.match(/(?:expires?|exp\.?|expiration)\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (expirationMatch) {
      fields.expirationDate = expirationMatch[1];
    }
    
    return fields;
  }

  private extractCommonFields(text: string): any {
    const fields: any = {};
    
    // Extract dates
    const dates = text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{1,2}-\d{1,2}-\d{4}\b|\b[A-Za-z]+\s+\d{1,2},?\s+\d{4}\b/g);
    if (dates) {
      fields.dates = dates;
    }
    
    // Extract numbers
    const numbers = text.match(/\b\d{3,}\b/g);
    if (numbers) {
      fields.numbers = numbers;
    }
    
    return fields;
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const ocrService = new OCRService();

// Cleanup on process exit
process.on('exit', () => {
  ocrService.cleanup();
});
