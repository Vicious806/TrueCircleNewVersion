import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils } from "lucide-react";
import { useLocation } from "wouter";
import truecircleLogo from "@assets/Screen_Shot_2025-06-27_at_4_1751237338042.webp";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative page-container bg-white">
      {/* Clean white background with subtle pattern */}
      <div className="absolute inset-0 bg-white">
        {/* Very subtle pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
              <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fill-rule="evenodd">
                  <g fill="#48b2b5" fill-opacity="0.1">
                    <circle cx="30" cy="30" r="2"/>
                    <circle cx="10" cy="10" r="1"/>
                    <circle cx="50" cy="10" r="1"/>
                    <circle cx="10" cy="50" r="1"/>
                    <circle cx="50" cy="50" r="1"/>
                  </g>
                </g>
              </svg>
            `)})`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>
      
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
              <p className="text-gray-600">Saturday Meetups</p>
            </div>

          <div className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-gray-600 text-sm">
                Saturday meetups at local restaurants and cafes.
              </p>
              

            </div>

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
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Terms of Service
                </button>
                {' '}and{' '}
                <button 
                  onClick={() => setLocation('/privacy')}
                  className="text-blue-600 hover:text-blue-700 underline"
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
