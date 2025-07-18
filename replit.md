# Document OCR Processing Platform

## Overview

This is a full-stack document processing platform that uses intelligent OCR (Optical Character Recognition) to extract text and structured data from various document types. The application is built with a modern tech stack including React, Express.js, PostgreSQL, and Tesseract.js for OCR processing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **File Processing**: Multer for file uploads, Sharp for image preprocessing
- **OCR Engine**: Tesseract.js for optical character recognition
- **Session Management**: Connect-pg-simple for PostgreSQL session storage

### Key Components

1. **Document Upload System**
   - Drag-and-drop file upload interface
   - Support for JPEG and PNG files (PDF temporarily disabled)
   - File size validation and type checking
   - Automatic document type detection

2. **Enhanced OCR Processing Pipeline**
   - Advanced image preprocessing with Sharp (upscaling, contrast enhancement, noise reduction)
   - Optimized Tesseract.js OCR engine with custom parameters
   - Intelligent text cleanup and character error correction
   - Confidence scoring and validation
   - Structured data extraction based on document type

3. **Document Management**
   - Document library with search functionality
   - Status tracking (pending, processing, completed, failed)
   - Preview and export capabilities
   - Retry mechanism for failed processing

4. **Dashboard and Analytics**
   - Real-time statistics and metrics
   - Processing queue monitoring
   - Recent activity tracking
   - Quick action shortcuts

## Data Flow

1. **Upload Process**:
   - User uploads document through drag-and-drop interface
   - File is validated and stored in uploads directory
   - Document metadata is saved to database with "pending" status

2. **Enhanced Processing Pipeline**:
   - Document status updated to "processing"
   - Advanced image preprocessing: upscaling, greyscale conversion, contrast enhancement, noise reduction
   - Optimized Tesseract.js with LSTM engine and custom parameters
   - Intelligent text cleanup with character error correction
   - Structured data extraction based on document type
   - Results stored in database with confidence scores

3. **Result Management**:
   - OCR results linked to original document
   - Bounding box data preserved for future reference
   - Export functionality for JSON and text formats
   - Search indexing for quick retrieval

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **drizzle-orm**: Type-safe database operations
- **tesseract.js**: OCR processing engine
- **sharp**: Image processing and optimization
- **multer**: File upload handling

### UI Components
- **@radix-ui/***: Headless UI components for accessibility
- **@tanstack/react-query**: Server state management
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

### Development Tools
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: JavaScript bundler for production

## Database Schema

### Tables
1. **users**: User authentication and profiles
2. **documents**: Document metadata and processing status
3. **ocr_results**: OCR extraction results and structured data

### Key Relationships
- One-to-many relationship between documents and OCR results
- Document status tracking for processing pipeline
- JSON fields for structured data and bounding boxes

## Deployment Strategy

### Development
- Uses Vite dev server with HMR for frontend
- tsx for TypeScript execution in development
- Database migrations with Drizzle Kit

### Production
- Vite build for optimized frontend assets
- esbuild for Node.js server bundling
- Static file serving for uploaded documents
- PostgreSQL database with connection pooling

### Configuration
- Environment variables for database connection
- File upload directory configuration
- OCR processing settings and limits
- Session management configuration

## Architecture Decisions

### Database Choice
- **PostgreSQL with Drizzle**: Chosen for type safety, complex queries, and JSONB support for structured data
- **Neon Database**: Serverless PostgreSQL for scalability and cost-effectiveness

### OCR Technology
- **Tesseract.js**: Browser-compatible OCR engine with good accuracy
- **Sharp**: Image preprocessing to improve OCR results
- **Client-side processing**: Reduces server load and improves responsiveness

### File Storage
- **Local file system**: Simple approach for development and small-scale deployment
- **Upload directory**: Configurable location for document storage
- **File naming**: UUID-based naming to prevent conflicts

### Frontend State Management
- **TanStack Query**: Handles server state, caching, and synchronization
- **React hooks**: Local component state for UI interactions
- **No global state**: Keeps architecture simple and predictable

The application prioritizes user experience with drag-and-drop uploads, real-time processing updates, and comprehensive document management features while maintaining a clean, maintainable codebase.