import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to TrueCircle
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-900">Terms of Service</CardTitle>
            <p className="text-gray-600">Last updated: June 29, 2025</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using TrueCircle, you accept and agree to be bound by the terms and provision of this agreement.</p>

            <h2>2. Service Description</h2>
            <p>TrueCircle is a social meetup platform that connects users for Saturday dining experiences at restaurants and cafes. Our service facilitates group meetups through smart matching based on preferences, location, and availability.</p>

            <h2>3. User Eligibility</h2>
            <p>You must be at least 18 years old to use our service. By using TrueCircle, you represent and warrant that you meet this age requirement.</p>

            <h2>4. User Responsibilities</h2>
            <ul>
              <li>Provide accurate and truthful information in your profile</li>
              <li>Treat other users with respect and courtesy</li>
              <li>Attend confirmed meetups or cancel with reasonable notice</li>
              <li>Follow local laws and venue policies during meetups</li>
              <li>Report inappropriate behavior or safety concerns</li>
            </ul>

            <h2>5. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Harass, abuse, or harm other users</li>
              <li>Create fake profiles or impersonate others</li>
              <li>Use the service for commercial solicitation</li>
              <li>Share inappropriate content or engage in disruptive behavior</li>
              <li>Attempt to access unauthorized areas of the platform</li>
            </ul>

            <h2>6. Safety and Liability</h2>
            <p>TrueCircle facilitates introductions but does not screen users or guarantee safety. Users meet at their own risk. We strongly recommend:</p>
            <ul>
              <li>Meeting in public places</li>
              <li>Informing friends or family of your plans</li>
              <li>Trusting your instincts about personal safety</li>
            </ul>
            <p>TrueCircle is not responsible for any incidents, injuries, or damages that occur during meetups.</p>

            <h2>7. Intellectual Property</h2>
            <p>The TrueCircle platform, including its design, functionality, and content, is owned by TrueCircle and protected by intellectual property laws.</p>

            <h2>8. Data and Privacy</h2>
            <p>Your use of TrueCircle is also governed by our Privacy Policy, which explains how we collect, use, and protect your information.</p>

            <h2>9. Service Availability</h2>
            <p>We strive to maintain consistent service availability but do not guarantee uninterrupted access. We may temporarily suspend service for maintenance or updates.</p>

            <h2>10. Account Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in behavior that harms the community.</p>

            <h2>11. Modifications</h2>
            <p>We may update these terms periodically. Continued use of the service after changes constitutes acceptance of the new terms.</p>

            <h2>12. Limitation of Liability</h2>
            <p>TrueCircle provides the service "as is" without warranties. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the service.</p>

            <h2>13. Governing Law</h2>
            <p>These terms are governed by applicable local laws. Any disputes will be resolved through appropriate legal channels.</p>

            <h2>Contact Us</h2>
            <p>If you have questions about these terms, please contact us at support@truecircle.com</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}