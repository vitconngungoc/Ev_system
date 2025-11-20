import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Battery, Zap, Leaf, DollarSign, Shield, Clock } from "lucide-react";

export default function AboutPage() {
  const features = [
    {
      icon: Battery,
      title: "100% Electric",
      description: "All our vehicles are fully electric, zero emissions",
    },
    {
      icon: Zap,
      title: "Fast Charging",
      description: "Access to quick charging stations nationwide",
    },
    {
      icon: Leaf,
      title: "Eco-Friendly",
      description: "Reduce your carbon footprint with every ride",
    },
    {
      icon: DollarSign,
      title: "Affordable Rates",
      description: "Competitive pricing with no hidden fees",
    },
    {
      icon: Shield,
      title: "Full Insurance",
      description: "Comprehensive coverage included in every rental",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Round-the-clock customer service and assistance",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Us</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Leading the way in sustainable transportation with our fleet of
            premium electric vehicles
          </p>
        </div>

        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-4">
              At EV Rental, we're committed to making electric transportation
              accessible to everyone. Our mission is to accelerate the
              transition to sustainable mobility by providing affordable,
              reliable, and convenient electric vehicle rentals.
            </p>
            <p className="text-gray-600">
              Founded in 2020, we've grown to become one of the largest EV
              rental services in the country, with thousands of satisfied
              customers and a rapidly expanding fleet of cutting-edge electric
              vehicles.
            </p>
          </CardContent>
        </Card>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-green-600 mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Our Commitment</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                <strong>Environmental Responsibility:</strong> We're dedicated
                to reducing carbon emissions and promoting clean energy
                solutions.
              </p>
              <p>
                <strong>Customer Satisfaction:</strong> Your experience is our
                priority, from easy booking to exceptional service.
              </p>
              <p>
                <strong>Innovation:</strong> We continuously update our fleet
                with the latest electric vehicle technology.
              </p>
              <p>
                <strong>Community:</strong> We partner with local businesses
                and support green initiatives in every city we operate.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
