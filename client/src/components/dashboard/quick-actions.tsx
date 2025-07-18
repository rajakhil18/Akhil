import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Upload, Brain, Download } from "lucide-react";

export default function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Link href="/upload">
            <Button variant="outline" className="w-full justify-start">
              <Upload className="h-4 w-4 mr-3 text-blue-600" />
              <div className="text-left">
                <p className="font-medium">Upload Documents</p>
                <p className="text-sm text-gray-500">Add new documents for processing</p>
              </div>
            </Button>
          </Link>

          <Button variant="outline" className="w-full justify-start">
            <Brain className="h-4 w-4 mr-3 text-orange-600" />
            <div className="text-left">
              <p className="font-medium">AI Training</p>
              <p className="text-sm text-gray-500">Improve handwriting recognition</p>
            </div>
          </Button>

          <Button variant="outline" className="w-full justify-start">
            <Download className="h-4 w-4 mr-3 text-green-600" />
            <div className="text-left">
              <p className="font-medium">Export Data</p>
              <p className="text-sm text-gray-500">Download processed results</p>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
