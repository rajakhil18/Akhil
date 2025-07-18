import { useQuery } from "@tanstack/react-query";
import StatsCards from "@/components/dashboard/stats-cards";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentActivity from "@/components/dashboard/recent-activity";
import DocumentUpload from "@/components/documents/document-upload";
import DocumentTable from "@/components/documents/document-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      const response = await fetch("/api/documents?limit=5");
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Document Processing Dashboard</h2>
        <p className="text-sm text-gray-500">Manage and process your documents with intelligent OCR</p>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActions />
        <RecentActivity />
      </div>

      <DocumentUpload />

      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentTable documents={documents || []} isLoading={documentsLoading} limit={5} />
        </CardContent>
      </Card>
    </div>
  );
}
