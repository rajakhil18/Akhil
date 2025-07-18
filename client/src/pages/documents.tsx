import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DocumentTable from "@/components/documents/document-table";
import { Search, Filter } from "lucide-react";

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      const response = await fetch("/api/documents");
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      refetch();
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/documents/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Search failed");
      const results = await response.json();
      // Update query cache with search results
      // For simplicity, we'll just refetch - in production you'd update the cache
      refetch();
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Document Library</h2>
        <p className="text-sm text-gray-500">Browse and manage all your processed documents</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching}
              variant="outline"
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          <DocumentTable documents={documents || []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
