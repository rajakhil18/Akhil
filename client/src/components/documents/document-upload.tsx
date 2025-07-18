import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, FileImage, FileText, Layers } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function DocumentUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState("auto-detect");
  const [processingMode, setProcessingMode] = useState("standard");
  const [outputFormat, setOutputFormat] = useState("json");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      formData.append("processingMode", processingMode);
      formData.append("outputFormat", outputFormat);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: `${data.originalName} has been uploaded and is being processed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });
      setSelectedFiles([]);
      setUploadProgress(0);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    setSelectedFiles(validFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    for (const file of selectedFiles) {
      setUploadProgress(0);
      try {
        await uploadMutation.mutateAsync(file);
      } catch (error) {
        // Error handling is done in the mutation
        break;
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-blue-600 bg-blue-50"
              : "border-gray-300 hover:border-blue-600 hover:bg-blue-50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CloudUpload className="text-blue-600 h-8 w-8" />
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Support for JPG, PNG, PDF files up to 10MB each
          </p>
          <div className="flex justify-center space-x-4">
            <div className="text-xs text-gray-500 flex items-center">
              <FileImage className="h-4 w-4 mr-1" />
              Images
            </div>
            <div className="text-xs text-gray-500 flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              PDFs
            </div>
            <div className="text-xs text-gray-500 flex items-center">
              <Layers className="h-4 w-4 mr-1" />
              Batch Upload
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {selectedFiles.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Selected Files:</h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{file.name}</span>
                  <span className="text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadMutation.isPending && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Document Type</h4>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto-detect">Auto-detect</SelectItem>
                <SelectItem value="certificate">Certificates</SelectItem>
                <SelectItem value="resume">Resumes</SelectItem>
                <SelectItem value="license">ID Documents</SelectItem>
                <SelectItem value="form">Forms</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Processing Mode</h4>
            <Select value={processingMode} onValueChange={setProcessingMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard OCR</SelectItem>
                <SelectItem value="enhanced">Enhanced (AI)</SelectItem>
                <SelectItem value="handwriting">Handwriting Focus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Output Format</h4>
            <Select value={outputFormat} onValueChange={setOutputFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="text">Plain Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploadMutation.isPending ? "Uploading..." : `Upload ${selectedFiles.length} file(s)`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
