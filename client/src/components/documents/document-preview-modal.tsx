import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: number;
  originalName: string;
  fileSize: number;
  documentType: string;
  status: string;
  confidenceScore: number | null;
  uploadedAt: string;
  filename: string;
}

interface DocumentPreviewModalProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentPreviewModal({ document, isOpen, onClose }: DocumentPreviewModalProps) {
  const { toast } = useToast();

  const { data: ocrResult, isLoading } = useQuery({
    queryKey: ["/api/documents", document.id, "ocr"],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${document.id}/ocr`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No OCR result yet
        }
        throw new Error("Failed to fetch OCR result");
      }
      return response.json();
    },
    enabled: isOpen && document.status === "completed",
  });

  const handleExportJson = () => {
    if (!ocrResult) return;
    
    const dataStr = JSON.stringify(ocrResult, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${document.originalName}_ocr_result.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Export successful",
      description: "OCR results exported as JSON",
    });
  };

  const renderStructuredData = (data: any) => {
    if (!data || !data.extractedFields) return null;
    
    return Object.entries(data.extractedFields).map(([key, value]) => (
      <div key={key} className="p-3 bg-white rounded border border-gray-200">
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          {key.replace(/([A-Z])/g, ' $1').trim()}
        </span>
        <p className="text-sm text-gray-900 mt-1">{value as string}</p>
      </div>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Preview & OCR Results</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document Preview */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Original Document</h4>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <img 
                src={`/api/files/${document.filename}`} 
                alt={document.originalName}
                className="w-full h-auto rounded-lg shadow-sm max-h-96 object-contain"
                onError={(e) => {
                  // Handle image load error - show placeholder
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="mt-2 text-sm text-gray-600">
                <p>File: {document.originalName}</p>
                <p>Type: {document.documentType}</p>
                <p>Status: <Badge variant="outline">{document.status}</Badge></p>
              </div>
            </div>
          </div>
          
          {/* OCR Results */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Extracted Text</h4>
            
            {document.status === "completed" && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Confidence Score:</span>
                  <span className="text-sm text-green-600 font-medium">
                    {document.confidenceScore || 0}%
                  </span>
                </div>
                
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : ocrResult ? (
                  <div className="space-y-2">
                    {ocrResult.structuredData && renderStructuredData(ocrResult.structuredData)}
                    
                    {ocrResult.extractedText && (
                      <div className="p-3 bg-white rounded border border-gray-200">
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          Full Text
                        </span>
                        <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                          {ocrResult.extractedText}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No OCR results available</p>
                )}
              </div>
            )}
            
            {document.status === "processing" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">Document is currently being processed...</p>
              </div>
            )}
            
            {document.status === "failed" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">OCR processing failed. Please try uploading again.</p>
              </div>
            )}
            
            {document.status === "pending" && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Document is pending processing...</p>
              </div>
            )}
            
            {document.status === "completed" && ocrResult && (
              <div className="flex space-x-2">
                <Button onClick={handleExportJson} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
                <Button variant="outline" className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Text
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
