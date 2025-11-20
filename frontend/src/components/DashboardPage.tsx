import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { 
  Car, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Battery,
  MapPin,
  Star 
} from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { icon: Car, label: "Total Vehicles", value: "156", change: "+12%" },
    { icon: Users, label: "Active Users", value: "2,847", change: "+18%" },
    { icon: DollarSign, label: "Revenue", value: "$45,280", change: "+25%" },
    { icon: Calendar, label: "Bookings", value: "1,523", change: "+15%" },
  ];

  const recentActivity = [
    { type: "booking", message: "New booking for Tesla Model 3", time: "5 min ago" },
    { type: "user", message: "New user registration", time: "15 min ago" },
    { type: "payment", message: "Payment received $250", time: "1 hour ago" },
    { type: "vehicle", message: "Vehicle maintenance completed", time: "2 hours ago" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className="h-8 w-8 text-green-600" />
                  <span className="text-green-600 text-sm font-medium">
                    {stat.change}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-0">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.message}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Battery className="h-5 w-5 text-green-600" />
                    <span>Avg. Battery Level</span>
                  </div>
                  <span className="font-bold">85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <span>Active Stations</span>
                  </div>
                  <span className="font-bold">45</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-green-600" />
                    <span>Avg. Rating</span>
                  </div>
                  <span className="font-bold">4.8</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span>Today's Bookings</span>
                  </div>
                  <span className="font-bold">28</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
