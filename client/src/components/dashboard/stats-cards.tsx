import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, Database, TrendingUp } from "lucide-react";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/documents/stats"],
    queryFn: async () => {
      const response = await fetch("/api/documents/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Documents",
      value: stats?.total || 0,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+12%",
      changeColor: "text-green-600",
    },
    {
      title: "Processing Queue",
      value: stats?.pending + stats?.processing || 0,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "2 min avg",
      changeColor: "text-gray-500",
    },
    {
      title: "Success Rate",
      value: stats?.total > 0 ? Math.round((stats?.completed / stats?.total) * 100) + "%" : "0%",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "+2.4%",
      changeColor: "text-green-600",
    },
    {
      title: "Avg Confidence",
      value: stats?.avgConfidence ? Math.round(stats.avgConfidence) + "%" : "0%",
      icon: Database,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "+8.7%",
      changeColor: "text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${card.color} h-6 w-6`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className={`${card.changeColor} h-4 w-4 mr-1`} />
                <span className={card.changeColor}>{card.change}</span>
                <span className="text-gray-500 ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
