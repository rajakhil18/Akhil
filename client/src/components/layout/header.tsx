import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
import { Link } from "wouter";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Processing Dashboard</h2>
          <p className="text-sm text-gray-500">Manage and process your documents with intelligent OCR</p>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/upload">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </Link>
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-500 cursor-pointer" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
