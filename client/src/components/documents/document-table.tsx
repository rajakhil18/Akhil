import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download, Edit, Trash2, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import DocumentPreviewModal from "./document-preview-modal";
import { apiRequest } from "@/lib/queryClient";

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

interface DocumentTableProps {
  documents: Document[];
  isLoading: boolean;
  limit?: number;
}

export default function DocumentTable({ documents, isLoading, limit }: DocumentTableProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const retryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/documents/${id}/retry`);
    },
    onSuccess: () => {
      toast({
        title: "Processing restarted",
        description: "The document has been queued for reprocessing.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to retry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "pending":
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      certificate: "bg-blue-100 text-blue-800",
      resume: "bg-purple-100 text-purple-800",
      license: "bg-green-100 text-green-800",
      form: "bg-orange-100 text-orange-800",
    };
    
    return (
      <Badge className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handlePreview = (document: Document) => {
    setSelectedDocument(document);
    setShowPreview(true);
  };

  const handleDownload = (document: Document) => {
    window.open(`/api/files/${document.filename}`, "_blank");
  };

  const handleRetry = (document: Document) => {
    retryMutation.mutate(document.id);
  };

  const handleDelete = (document: Document) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate(document.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const displayDocuments = limit ? documents.slice(0, limit) : documents;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">Document</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Confidence</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Uploaded</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayDocuments.map((document) => (
              <tr key={document.id} className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Eye className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{document.originalName}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(document.fileSize)}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">{getTypeBadge(document.documentType)}</td>
                <td className="py-4 px-4">{getStatusBadge(document.status)}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          document.confidenceScore
                            ? document.confidenceScore > 80
                              ? "bg-green-500"
                              : document.confidenceScore > 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                            : "bg-gray-300"
                        }`}
                        style={{ width: `${document.confidenceScore || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-900">
                      {document.confidenceScore ? `${document.confidenceScore}%` : "--"}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-gray-500">
                  {formatDistanceToNow(new Date(document.uploadedAt), { addSuffix: true })}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(document)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(document)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {document.status === "failed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetry(document)}
                        disabled={retryMutation.isPending}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(document)}
                      disabled={deleteMutation.isPending}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedDocument && (
        <DocumentPreviewModal
          document={selectedDocument}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
