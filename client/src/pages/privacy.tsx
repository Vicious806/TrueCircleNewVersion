import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
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
            <CardTitle className="text-3xl font-bold text-gray-900">Privacy Policy</CardTitle>
            <p className="text-gray-600">Last updated: June 29, 2025</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h2>1. Information We Collect</h2>
            
            <h3>Personal Information</h3>
            <p>When you create an account, we collect:</p>
            <ul>
              <li>Name and username</li>
              <li>Email address</li>
              <li>Date of birth (for age verification)</li>
              <li>Profile picture (optional)</li>
              <li>Location information</li>
              <li>Bio and interests</li>
            </ul>

            <h3>Preference Information</h3>
            <p>To facilitate matching, we collect:</p>
            <ul>
              <li>Survey responses about conversation topics, music, entertainment, personality, and hobbies</li>
              <li>Venue preferences (restaurant vs cafe)</li>
              <li>Age range preferences</li>
              <li>Time and date availability</li>
              <li>Maximum distance for meetups</li>
            </ul>

            <h3>Usage Information</h3>
            <p>We automatically collect:</p>
            <ul>
              <li>Chat messages within the platform</li>
              <li>Meetup participation history</li>
              <li>Platform usage patterns</li>
              <li>Device and browser information</li>
              <li>IP address and general location</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            
            <h3>Core Service Functions</h3>
            <ul>
              <li>Create and maintain your account</li>
              <li>Match you with compatible users for meetups</li>
              <li>Facilitate communication between matched users</li>
              <li>Send verification emails and important notifications</li>
              <li>Coordinate meetup logistics (location, time, participants)</li>
            </ul>

            <h3>Service Improvement</h3>
            <ul>
              <li>Analyze usage patterns to improve our matching algorithm</li>
              <li>Enhance platform functionality and user experience</li>
              <li>Develop new features based on user behavior</li>
            </ul>

            <h3>Safety and Security</h3>
            <ul>
              <li>Verify user identities and prevent fraud</li>
              <li>Monitor for inappropriate behavior</li>
              <li>Investigate reports of misconduct</li>
              <li>Maintain platform security</li>
            </ul>

            <h2>3. Information Sharing</h2>
            
            <h3>With Other Users</h3>
            <p>We share limited information to facilitate meetups:</p>
            <ul>
              <li>First name and profile picture in group chats</li>
              <li>Bio and interests when viewing profiles</li>
              <li>General location area for distance-based matching</li>
              <li>Age range (not exact age) for compatibility</li>
            </ul>

            <h3>We Do NOT Share</h3>
            <ul>
              <li>Your exact address or precise location</li>
              <li>Your email address or contact information</li>
              <li>Your date of birth or exact age</li>
              <li>Private messages with other users</li>
              <li>Your personal information with advertisers</li>
            </ul>

            <h3>Legal Requirements</h3>
            <p>We may share information when required by law, such as:</p>
            <ul>
              <li>Responding to legal process or government requests</li>
              <li>Protecting rights, property, or safety</li>
              <li>Preventing fraud or illegal activity</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>We implement industry-standard security measures:</p>
            <ul>
              <li>Encrypted data transmission (HTTPS)</li>
              <li>Secure password storage with hashing</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal information</li>
              <li>Secure database storage</li>
            </ul>

            <h2>5. Your Privacy Rights</h2>
            
            <h3>Account Control</h3>
            <ul>
              <li>Update your profile information anytime</li>
              <li>Delete your account and associated data</li>
              <li>Control what information is visible to others</li>
              <li>Opt out of non-essential communications</li>
            </ul>

            <h3>Data Access</h3>
            <ul>
              <li>Request a copy of your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of specific data</li>
            </ul>

            <h2>6. Data Retention</h2>
            <p>We retain your information as long as your account is active. When you delete your account:</p>
            <ul>
              <li>Profile information is immediately removed</li>
              <li>Chat messages are deleted within 30 days</li>
              <li>Some anonymized usage data may be retained for analytics</li>
              <li>Legal or safety-related information may be retained as required</li>
            </ul>

            <h2>7. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies to:</p>
            <ul>
              <li>Keep you logged in to your account</li>
              <li>Remember your preferences</li>
              <li>Analyze platform usage</li>
              <li>Improve security</li>
            </ul>
            <p>You can control cookie settings through your browser.</p>

            <h2>8. Age and Minors</h2>
            <p>TrueCircle is intended for users 18 and older. We do not knowingly collect information from minors under 18. If we become aware of such data, we will delete it promptly.</p>

            <h2>9. International Users</h2>
            <p>If you're located outside your country, your information may be transferred to and processed in other countries. We ensure adequate protection regardless of location.</p>

            <h2>10. Changes to Privacy Policy</h2>
            <p>We may update this policy periodically. We'll notify users of significant changes through email or platform notifications. Continued use after changes indicates acceptance.</p>

            <h2>11. Contact Us</h2>
            <p>For privacy-related questions or to exercise your rights:</p>
            <ul>
              <li>Email: privacy@truecircle.com</li>
              <li>Subject line: "Privacy Request"</li>
              <li>Include your username and specific request</li>
            </ul>

            <h2>12. Third-Party Services</h2>
            <p>We use trusted third-party services for:</p>
            <ul>
              <li>Email delivery (with encryption)</li>
              <li>Database hosting (with security measures)</li>
              <li>Address lookup for location features</li>
            </ul>
            <p>These services are bound by their own privacy policies and our data protection agreements.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}