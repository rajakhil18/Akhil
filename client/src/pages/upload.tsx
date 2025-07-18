import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DocumentUpload from "@/components/documents/document-upload";
import { CloudUpload } from "lucide-react";

export default function Upload() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CloudUpload className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Upload Documents</h2>
        <p className="text-sm text-gray-500 mt-2">
          Upload your documents for intelligent OCR processing and indexing
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <DocumentUpload />
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Supported Document Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Certificates</h3>
              <p className="text-sm text-gray-600">
                Academic certificates, professional certifications, awards
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Resumes</h3>
              <p className="text-sm text-gray-600">
                CVs, resumes, professional profiles
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">ID Documents</h3>
              <p className="text-sm text-gray-600">
                Driver's licenses, passports, ID cards
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Forms</h3>
              <p className="text-sm text-gray-600">
                Application forms, legal documents, contracts
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Handwritten</h3>
              <p className="text-sm text-gray-600">
                Handwritten notes, legacy documents
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Multi-page</h3>
              <p className="text-sm text-gray-600">
                Multi-page PDFs, document batches
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
