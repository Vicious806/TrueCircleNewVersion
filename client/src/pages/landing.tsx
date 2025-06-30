import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils } from "lucide-react";
import { useLocation } from "wouter";
import truecircleLogo from "@assets/Screen_Shot_2025-06-27_at_4_1751237338042.webp";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white page-container">
      
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md mx-4 shadow-xl rounded-3xl bg-white border border-gray-200">
          <CardContent className="pt-8 pb-8 px-8">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-4">
                <img 
                  src={truecircleLogo} 
                  alt="TrueCircle Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">TrueCircle</h1>
              <p className="text-gray-600 mb-8">Saturday meetups</p>
            </div>

          <div className="space-y-6">

            <Button 
              onClick={() => setLocation('/auth')}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started
            </Button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our{' '}
                <button 
                  onClick={() => setLocation('/terms')}
                  className="text-primary hover:text-primary/80 underline"
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button 
                  onClick={() => setLocation('/privacy')}
                  className="text-primary hover:text-primary/80 underline"
                >
                  Privacy Policy
                </button>
              </p>
            </div>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
