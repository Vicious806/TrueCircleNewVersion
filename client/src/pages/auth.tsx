import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Users, Coffee, Calendar, Heart } from "lucide-react";


import { loginSchema, registerSchema, emailVerificationSchema, forgotPasswordSchema, resetPasswordSchema, type LoginData, type RegisterData, type EmailVerification, type ForgotPasswordData, type ResetPasswordData } from "@shared/schema";

type LoginFormData = LoginData;
type RegisterFormData = RegisterData;

// Helper functions for date dropdowns
const getMonths = () => [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" }
];

const getDays = () => {
  const days = [];
  for (let i = 1; i <= 31; i++) {
    const value = i.toString().padStart(2, '0');
    days.push({ value, label: i.toString() });
  }
  return days;
};

const getYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 18; i >= currentYear - 80; i--) {
    years.push({ value: i.toString(), label: i.toString() });
  }
  return years;
};

export default function Auth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  const [showVerification, setShowVerification] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");

  // Check for email verification status on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    
    if (verified === 'true') {
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified. You can now log in.",
        variant: "default",
      });
      setActiveTab("login");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (verified === 'false') {
      toast({
        title: "Verification Failed",
        description: "Email verification failed or link expired. Please try registering again.",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
    },
  });

  const verifyForm = useForm<EmailVerification>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: {
      email: "",
      code: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetPasswordForm = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      code: "",
      newPassword: "",
    },
  });

  // Set email in verify form when it changes
  useEffect(() => {
    if (registrationEmail) {
      verifyForm.setValue("email", registrationEmail);
    }
  }, [registrationEmail, verifyForm]);

  // Update dateOfBirth field when dropdown selections change
  useEffect(() => {
    if (birthMonth && birthDay && birthYear) {
      const dateString = `${birthYear}-${birthMonth}-${birthDay}`;
      registerForm.setValue("dateOfBirth", dateString);
    }
  }, [birthMonth, birthDay, birthYear, registerForm]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      // Fast navigation without toast delay
      setLocation('/');
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Check your email!",
        description: "We've sent you a verification code to complete your registration.",
      });
      setRegistrationEmail(registerForm.getValues("email"));
      setShowVerification(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: EmailVerification) => {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verification failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Email verified!",
        description: "Your account has been created successfully.",
      });
      setLocation('/');
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend verification');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Code sent!",
        description: "A new verification code has been sent to your email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resend",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send reset email');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reset email sent!",
        description: "Check your email for the password reset code.",
      });
      setShowPasswordReset(true);
      setShowForgotPassword(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send reset email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset successful!",
        description: "You can now log in with your new password.",
      });
      setShowPasswordReset(false);
      setActiveTab("login");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    // Adjust age if birthday hasn't occurred this year
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
    
    if (actualAge < 18) {
      toast({
        title: "Age Requirement",
        description: "You must be at least 18 years old to join TrueCircle.",
        variant: "destructive",
      });
      return;
    }

    const registrationData = {
      ...data,
      age: actualAge
    };
    
    registerMutation.mutate(registrationData);
  };

  const onVerifySubmit = (data: EmailVerification) => {
    verifyMutation.mutate(data);
  };

  const onForgotPasswordSubmit = (data: ForgotPasswordData) => {
    setResetEmail(data.email);
    resetPasswordForm.setValue("email", data.email);
    forgotPasswordMutation.mutate(data);
  };

  const onResetPasswordSubmit = (data: ResetPasswordData) => {
    resetPasswordMutation.mutate(data);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
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
        
        <div className="relative flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white">Reset Password</h1>
              <p className="text-blue-100 mt-2">Enter your email to receive a reset code</p>
            </div>

            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-gray-900">Forgot Password?</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  No worries! Enter your email and we'll send you a reset code.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail" className="text-sm font-medium text-gray-700">Email Address</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      {...forgotPasswordForm.register("email")}
                      placeholder="Enter your email address"
                      className="h-11 border-2 focus:border-blue-400"
                    />
                    {forgotPasswordForm.formState.errors.email && (
                      <p className="text-sm text-red-500">
                        {forgotPasswordForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1 h-12"
                    >
                      Back to Login
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
                      disabled={forgotPasswordMutation.isPending}
                    >
                      {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Code"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (showPasswordReset) {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
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
        
        <div className="relative flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white">Create New Password</h1>
              <p className="text-blue-100 mt-2">Enter the code from your email</p>
            </div>

            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-gray-900">Reset Your Password</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Enter the 6-digit code sent to <span className="font-semibold text-blue-600">{resetEmail}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-6">
                  <input 
                    type="hidden" 
                    {...resetPasswordForm.register("email")} 
                  />
                  
                  <div className="space-y-2">
                    <Label htmlFor="resetCode" className="text-sm font-medium text-gray-700">Reset Code</Label>
                    <Input
                      id="resetCode"
                      type="text"
                      {...resetPasswordForm.register("code")}
                      placeholder="Enter 6-digit code"
                      className="h-11 border-2 focus:border-blue-400 text-center text-2xl tracking-widest font-mono"
                      maxLength={6}
                    />
                    {resetPasswordForm.formState.errors.code && (
                      <p className="text-sm text-red-500">
                        {resetPasswordForm.formState.errors.code.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...resetPasswordForm.register("newPassword")}
                      placeholder="Enter your new password"
                      className="h-11 border-2 focus:border-blue-400"
                    />
                    {resetPasswordForm.formState.errors.newPassword && (
                      <p className="text-sm text-red-500">
                        {resetPasswordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordReset(false);
                        setShowForgotPassword(true);
                      }}
                      className="flex-1 h-12"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
                      disabled={resetPasswordMutation.isPending}
                    >
                      {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (showVerification) {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Subtle pattern overlay */}
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
        
        <div className="relative flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white">Almost There!</h1>
              <p className="text-blue-100 mt-2">Check your email for the verification code</p>
            </div>

            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl text-gray-900">Verify Your Email</CardTitle>
                <CardDescription className="text-base text-gray-600">
                  We sent a 6-digit code to <span className="font-semibold text-blue-600">{registrationEmail}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-6">
                  <input 
                    type="hidden" 
                    {...verifyForm.register("email")} 
                  />
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-sm font-medium text-gray-700">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      maxLength={6}
                      {...verifyForm.register("code")}
                      placeholder="000000"
                      className="text-center text-2xl font-mono tracking-widest h-14 border-2 focus:border-blue-400"
                    />
                    {verifyForm.formState.errors.code && (
                      <p className="text-sm text-red-500 text-center">
                        {verifyForm.formState.errors.code.message}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-medium"
                    disabled={verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? "Verifying..." : "Verify & Continue"}
                  </Button>

                  <div className="flex space-x-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1 h-10"
                      onClick={() => resendMutation.mutate(registrationEmail)}
                      disabled={resendMutation.isPending}
                    >
                      {resendMutation.isPending ? "Sending..." : "Resend Code"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1 h-10"
                      onClick={() => setShowVerification(false)}
                    >
                      Back to Login
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
      
      <div className="relative flex min-h-screen">
        {/* Left side - Welcome content */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-6">
              Find Your True Circle
            </h1>
            <p className="text-xl text-gray-100 mb-8 leading-relaxed">
              Join people across the world for authentic Saturday dining experiences. Real people, real conversations, real friendships.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center text-gray-100">
                <Users className="h-5 w-5 mr-3 text-amber-300" />
                <span>Meet 2-4 people in your area</span>
              </div>
              <div className="flex items-center text-gray-100">
                <Coffee className="h-5 w-5 mr-3 text-amber-300" />
                <span>Discover amazing cafes and restaurants</span>
              </div>
              <div className="flex items-center text-gray-100">
                <Calendar className="h-5 w-5 mr-3 text-amber-300" />
                <span>Every Saturday: brunch, lunch, or dinner</span>
              </div>
              <div className="flex items-center text-gray-100">
                <Heart className="h-5 w-5 mr-3 text-amber-300" />
                <span>Build genuine friendships that last</span>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <p className="text-sm text-gray-200 italic">
                "I've met some of my closest friends through TrueCircle Saturday dinners. It's amazing how sharing a meal can create such deep connections!"
              </p>
              <p className="text-xs text-amber-300 mt-2">- Sarah, TrueCircle Member</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 lg:px-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8 lg:hidden">
              <h1 className="text-2xl font-bold text-white">TrueCircle</h1>
              <p className="text-gray-200 mt-1">Saturday meetups for adults 18+</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-white/90 backdrop-blur-sm">
                <TabsTrigger value="login" className="text-base font-medium">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="text-base font-medium">Join Now</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl text-center text-gray-900">Welcome Back!</CardTitle>
                    <CardDescription className="text-center text-base text-gray-600">
                      Ready to meet new friends this Saturday?
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="usernameOrEmail" className="text-sm font-medium text-gray-700">Username or Email</Label>
                        <Input
                          id="usernameOrEmail"
                          type="text"
                          {...loginForm.register("usernameOrEmail")}
                          placeholder="Enter your username or email"
                          className="h-11 border-2 focus:border-blue-400"
                        />
                        {loginForm.formState.errors.usernameOrEmail && (
                          <p className="text-sm text-red-500">
                            {loginForm.formState.errors.usernameOrEmail.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          {...loginForm.register("password")}
                          placeholder="Enter your password"
                          className="h-11 border-2 focus:border-blue-400"
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-red-500">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div className="text-center mb-4">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                          Forgot your password?
                        </button>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-medium"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="register">
                <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl text-center text-gray-900">Join TrueCircle</CardTitle>
                    <CardDescription className="text-center text-base text-gray-600">
                      Start making real connections with people in your area
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                          <Input
                            id="firstName"
                            type="text"
                            {...registerForm.register("firstName")}
                            placeholder="First name"
                            className="h-11 border-2 focus:border-blue-400"
                          />
                          {registerForm.formState.errors.firstName && (
                            <p className="text-xs text-red-500">
                              {registerForm.formState.errors.firstName.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                          <Input
                            id="lastName"
                            type="text"
                            {...registerForm.register("lastName")}
                            placeholder="Last name"
                            className="h-11 border-2 focus:border-blue-400"
                          />
                          {registerForm.formState.errors.lastName && (
                            <p className="text-xs text-red-500">
                              {registerForm.formState.errors.lastName.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          {...registerForm.register("username")}
                          placeholder="Choose a username"
                          className="h-11 border-2 focus:border-blue-400"
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-sm text-red-500">
                            {registerForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...registerForm.register("email")}
                          placeholder="Your email address"
                          className="h-11 border-2 focus:border-blue-400"
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-sm text-red-500">
                            {registerForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          {...registerForm.register("password")}
                          placeholder="Create a password"
                          className="h-11 border-2 focus:border-blue-400"
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-red-500">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Select value={birthMonth} onValueChange={setBirthMonth}>
                            <SelectTrigger className="h-11 border-2 focus:border-blue-400">
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {getMonths().map((month) => (
                                <SelectItem key={month.value} value={month.value}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select value={birthDay} onValueChange={setBirthDay}>
                            <SelectTrigger className="h-11 border-2 focus:border-blue-400">
                              <SelectValue placeholder="Day" />
                            </SelectTrigger>
                            <SelectContent>
                              {getDays().map((day) => (
                                <SelectItem key={day.value} value={day.value}>
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select value={birthYear} onValueChange={setBirthYear}>
                            <SelectTrigger className="h-11 border-2 focus:border-blue-400">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {getYears().map((year) => (
                                <SelectItem key={year.value} value={year.value}>
                                  {year.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {registerForm.formState.errors.dateOfBirth && (
                          <p className="text-sm text-red-500">
                            {registerForm.formState.errors.dateOfBirth.message}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 p-4 bg-amber-50/80 rounded-lg border border-amber-200">
                        <Checkbox
                          id="isAdult"
                          className="border-2 border-amber-400"
                        />
                        <Label htmlFor="isAdult" className="text-sm font-medium text-amber-900 leading-tight">
                          I confirm that I am 18+ years old
                        </Label>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg font-medium"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating account..." : "Join TrueCircle"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}