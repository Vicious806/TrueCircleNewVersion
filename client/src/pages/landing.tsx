import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md mx-4 shadow-xl rounded-3xl">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
              <Utensils className="text-white text-2xl" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">FriendMeet</h1>
            <p className="text-gray-600">Connect & Dine Together</p>
          </div>

          <div className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-gray-600 text-sm">
                Join our community of food lovers and make new friends over amazing meals.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-gray-700 font-medium">
                  <strong>18+ Only:</strong> This platform is exclusively for adults aged 18 and over.
                </p>
              </div>
            </div>

            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="w-full gradient-primary text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Sign In with Replit
            </Button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
