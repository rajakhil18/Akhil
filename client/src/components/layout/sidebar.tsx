import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  BarChart3, 
  Upload, 
  FolderOpen, 
  Search, 
  Settings,
  User
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Upload Documents", href: "/upload", icon: Upload },
  { name: "Document Library", href: "/documents", icon: FolderOpen },
  { name: "Search & Index", href: "/search", icon: Search },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="text-white h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">IntelliDoc</h1>
            <p className="text-sm text-gray-500">OCR Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="text-gray-600 h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">John Admin</p>
            <p className="text-xs text-gray-500">System Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}
