import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, AlertTriangle, Brain } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function RecentActivity() {
  const { data: documents, isLoading } = useQuery({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      const response = await fetch("/api/documents?limit=4");
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100";
      case "processing":
        return "bg-orange-100";
      case "failed":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  const getActivityMessage = (document: any) => {
    switch (document.status) {
      case "completed":
        return `${document.originalName} processed successfully`;
      case "processing":
        return `${document.originalName} added to processing queue`;
      case "failed":
        return `${document.originalName} processing failed`;
      default:
        return `${document.originalName} uploaded`;
    }
  };

  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        <a href="/documents" className="text-blue-600 hover:text-blue-700 text-sm">
          View all
        </a>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents?.map((document: any) => (
            <div key={document.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
              <div className={`w-10 h-10 ${getStatusColor(document.status)} rounded-full flex items-center justify-center`}>
                {getStatusIcon(document.status)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {getActivityMessage(document)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(document.uploadedAt), { addSuffix: true })}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {document.status === "completed" && document.confidenceScore && (
                  <span>{document.confidenceScore}% confidence</span>
                )}
                {document.status === "processing" && <span>Processing</span>}
                {document.status === "failed" && <span className="text-red-600">Failed</span>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
