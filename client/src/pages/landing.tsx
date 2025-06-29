import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative page-container">
      {/* Professional background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Subtle geometric pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
              <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fill-rule="evenodd">
                  <g fill="#ffffff" fill-opacity="0.1">
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
        {/* Soft lighting effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md mx-4 shadow-xl rounded-3xl bg-white/90 backdrop-blur-md border border-white/20">
          <CardContent className="pt-8 pb-8 px-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Utensils className="text-white text-2xl" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">TrueCircle</h1>
              <p className="text-gray-600">College Students Connect Every Saturday</p>
            </div>

          <div className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-gray-600 text-sm">
                Meet fellow college students every Saturday for brunch, lunch, or dinner at local restaurants and cafes.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-gray-700 font-medium">
                  <strong>College Students Only:</strong> This platform is exclusively for students aged 18-25.
                </p>
              </div>
            </div>

            <Button 
              onClick={() => setLocation('/auth')}
              className="w-full gradient-primary text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started
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
    </div>
  );
}
