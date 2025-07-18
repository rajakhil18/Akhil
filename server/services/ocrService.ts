import { createWorker } from "tesseract.js";
import { storage } from "../storage";
import sharp from "sharp";
import path from "path";
import fs from "fs";

class OCRService {
  private worker: any = null;

  async initializeWorker() {
    if (!this.worker) {
      this.worker = await createWorker('eng', 1, {
        logger: m => console.log(m),
        errorHandler: err => console.error(err)
      });
      
      // Configure OCR parameters for better accuracy
      await this.worker.setParameters({
        'tessedit_char_whitelist': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?@#$%^&*()_+-=[]{}|;:\'",.<>/\\`~',
        'tessedit_pageseg_mode': '1', // Automatic page segmentation with OSD
        'tessedit_ocr_engine_mode': '1', // Use LSTM OCR engine
        'preserve_interword_spaces': '1',
        'user_defined_dpi': '300',
        'tessedit_do_invert': '0'
      });
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
      
      // Clean up extracted text
      const cleanedText = this.cleanupText(data.text);
      
      // Calculate confidence score
      const confidenceScore = Math.round(data.confidence);
      
      // Extract structured data based on document type
      const structuredData = this.extractStructuredData(cleanedText, document.documentType);
      
      // Store OCR results
      await storage.createOcrResult({
        documentId: document.id,
        extractedText: cleanedText,
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
    // If it's a PDF, we can't process it with current setup
    if (mimeType === 'application/pdf') {
      throw new Error('PDF processing is not currently supported. Please upload an image file (JPEG, PNG).');
    }

    // Advanced preprocessing for better OCR results
    const processedPath = filePath.replace(path.extname(filePath), '_processed.png');
    
    // Get image metadata to determine appropriate processing
    const metadata = await sharp(filePath).metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;
    
    // Calculate optimal scale factor for better OCR
    const targetWidth = Math.max(width * 2, 2000); // Upscale for better OCR
    
    await sharp(filePath)
      .resize(targetWidth, null, { 
        kernel: sharp.kernel.lanczos3,
        withoutEnlargement: false
      })
      .greyscale()
      .normalize()
      .linear(1.2, -(128 * 1.2) + 128) // Increase contrast
      .sharpen({ sigma: 1, m1: 1, m2: 2, x1: 2, y2: 10, y3: 20 })
      .median(3) // Reduce noise
      .png({ quality: 100, compressionLevel: 0 })
      .toFile(processedPath);
    
    return processedPath;
  }

  private cleanupText(text: string): string {
    return text
      // Remove excessive whitespace and normalize line breaks
      .replace(/\s{2,}/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      // Fix common OCR character errors in context
      .replace(/[|]/g, 'I')
      .replace(/\b0(?=[A-Za-z])/g, 'O') // 0 followed by letter -> O
      .replace(/\b5(?=[A-Za-z])/g, 'S') // 5 followed by letter -> S
      .replace(/\b1(?=[A-Za-z])/g, 'l') // 1 followed by letter -> l
      // Remove strange characters but preserve common symbols
      .replace(/[^\w\s.,!?@#$%^&*()_+\-=\[\]{}|;:'",.<>/\\`~\n]/g, '')
      // Clean up spacing around punctuation
      .replace(/\s+([.,!?;:])/g, '$1')
      .replace(/([.,!?;:])\s*/g, '$1 ')
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Remove duplicate spaces
      .replace(/\s+/g, ' ')
      .trim();
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
