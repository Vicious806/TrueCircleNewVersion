import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import truecircleLogo from "@assets/Screen_Shot_2025-06-27_at_4_1751237338042.webp";
import {
  registerSchema,
  loginSchema,
  emailVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginData,
  type EmailVerification,
  type ForgotPasswordData,
  type ResetPasswordData,
} from "@shared/schema";
import { z } from "zod";

// Extended register schema with date handling
const registerFormSchema = registerSchema.extend({
  confirmPassword: z.string().min(6, "Password confirmation is required"),
  dateOfBirth: z.object({
    month: z.number().min(1).max(12),
    day: z.number().min(1).max(31),
    year: z.number().min(1900).max(2024),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerFormSchema>;

export default function Auth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLogin, setIsLogin] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [resetPasswordEmail, setResetPasswordEmail] = useState("");

  // Login form
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: {
        month: 1,
        day: 1,
        year: 2000,
      },
      isAdult: true,
    },
  });

  // Verification form
  const verifyForm = useForm<EmailVerification>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: {
      email: "",
      code: "",
    },
  });

  // Password reset forms
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

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: () => {
      // Force refresh user data and redirect
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      // Convert date object to string for API
      const { month, day, year } = data.dateOfBirth;
      const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      const payload = {
        ...data,
        dateOfBirth: dateString,
      };
      
      const response = await apiRequest("POST", "/api/auth/register", payload);
      return response.json();
    },
    onSuccess: (data, variables) => {
      const email = data.email || variables.email;
      setRegistrationEmail(email);
      verifyForm.setValue("email", email);
      setShowVerification(true);
      toast({
        title: "Registration started",
        description: "Check your email for verification code",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Email verification mutation
  const verifyMutation = useMutation({
    mutationFn: async (data: EmailVerification) => {
      const response = await apiRequest("POST", "/api/auth/verify-email", data);
      return response.json();
    },
    onSuccess: () => {
      // Refresh user data since they're now logged in
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setLocation("/");
      toast({
        title: "Email verified",
        description: "Welcome to TrueCircle!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Resend verification mutation
  const resendMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/auth/resend-verification", { email });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Code sent",
        description: "New verification code sent to your email",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      const email = data.email || variables.email;
      setResetPasswordEmail(email);
      setShowResetPassword(true);
      resetPasswordForm.setValue("email", email);
      toast({
        title: "Reset code sent",
        description: "Check your email for password reset code",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", data);
      return response.json();
    },
    onSuccess: () => {
      setShowForgotPassword(false);
      setShowResetPassword(false);
      setIsLogin(true);
      toast({
        title: "Password reset",
        description: "Your password has been reset. Please log in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  const onVerifySubmit = (data: EmailVerification) => {
    verifyMutation.mutate(data);
  };

  const onForgotPasswordSubmit = (data: ForgotPasswordData) => {
    forgotPasswordMutation.mutate(data);
  };

  const onResetPasswordSubmit = (data: ResetPasswordData) => {
    resetPasswordMutation.mutate(data);
  };

  // Generate month options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate day options (1-31)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Generate year options (current year - 80 to current year - 18)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 63 }, (_, i) => currentYear - 18 - i);

  // Password reset flow
  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4">
              <img 
                src={truecircleLogo} 
                alt="TrueCircle Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-600 mt-2">Enter your new password</p>
          </div>

          <Card className="shadow-lg border border-gray-200 bg-white rounded-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-gray-900">Create New Password</CardTitle>
              <CardDescription className="text-base text-gray-600">
                Code sent to <span className="font-semibold text-primary">{resetPasswordEmail}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-6">
                <input 
                  type="hidden" 
                  {...resetPasswordForm.register("email")} 
                />
                
                <div className="space-y-2">
                  <Label htmlFor="reset-code" className="text-sm font-medium text-gray-700">Reset Code</Label>
                  <Input
                    id="reset-code"
                    type="text"
                    maxLength={6}
                    {...resetPasswordForm.register("code")}
                    placeholder="000000"
                    className="text-center text-lg font-mono tracking-widest h-12 border-2 focus:border-primary"
                  />
                  {resetPasswordForm.formState.errors.code && (
                    <p className="text-sm text-red-500 text-center">
                      {resetPasswordForm.formState.errors.code.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    {...resetPasswordForm.register("newPassword")}
                    className="h-12 border-2 focus:border-primary"
                  />
                  {resetPasswordForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-500">
                      {resetPasswordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-medium"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-10"
                  onClick={() => {
                    setShowResetPassword(false);
                    setShowForgotPassword(false);
                  }}
                >
                  Back to Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Forgot password flow
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4">
              <img 
                src={truecircleLogo} 
                alt="TrueCircle Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
            <p className="text-gray-600 mt-2">Enter your email to reset</p>
          </div>

          <Card className="shadow-lg border border-gray-200 bg-white rounded-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-gray-900">Reset Password</CardTitle>
              <CardDescription className="text-base text-gray-600">
                We'll send you a reset code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    {...forgotPasswordForm.register("email")}
                    placeholder="you@example.com"
                    className="h-12 border-2 focus:border-primary"
                  />
                  {forgotPasswordForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {forgotPasswordForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-medium"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Code"}
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-10"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Back to Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Email verification flow
  if (showVerification) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4">
              <img 
                src={truecircleLogo} 
                alt="TrueCircle Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Check Email</h1>
            <p className="text-gray-600 mt-2">Enter verification code</p>
          </div>

          <Card className="shadow-lg border border-gray-200 bg-white rounded-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl text-gray-900">Verify Email</CardTitle>
              <CardDescription className="text-base text-gray-600">
                Code sent to <span className="font-semibold text-primary">{registrationEmail}</span>
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
                    className="text-center text-2xl font-mono tracking-widest h-14 border-2 focus:border-primary"
                  />
                  {verifyForm.formState.errors.code && (
                    <p className="text-sm text-red-500 text-center">
                      {verifyForm.formState.errors.code.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-medium"
                  disabled={verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? "Verifying..." : "Verify"}
                </Button>

                <div className="flex space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 h-10"
                    onClick={() => resendMutation.mutate(registrationEmail)}
                    disabled={resendMutation.isPending}
                  >
                    {resendMutation.isPending ? "Sending..." : "Resend"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 h-10"
                    onClick={() => setShowVerification(false)}
                  >
                    Back
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main auth page
  return (
    <div className="min-h-screen bg-white page-container">
      {/* Clean white background */}
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
                  </g>
                </g>
              </svg>
            `)})`,
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Logo and welcome */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 to-primary/10 flex-col justify-center items-center p-12">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 mx-auto mb-8">
              <img 
                src={truecircleLogo} 
                alt="TrueCircle Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to TrueCircle</h1>
            <p className="text-lg text-gray-600 mb-8">Connect with people around Saturday meetups at cafes and restaurants</p>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
              <p className="text-sm text-gray-700 italic">"I've met amazing people through TrueCircle. The Saturday meetups are the highlight of my week!"</p>
              <p className="text-xs text-gray-500 mt-2">- Sarah, Community Member</p>
            </div>
          </div>
        </div>

        {/* Right side - Forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4">
                <img 
                  src={truecircleLogo} 
                  alt="TrueCircle Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">TrueCircle</h1>
            </div>

            {/* Form toggle */}
            <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  isLogin
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  !isLogin
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Login Form */}
            {isLogin && (
              <Card className="shadow-lg border border-gray-200 bg-white rounded-xl">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl text-gray-900">Welcome back</CardTitle>
                  <CardDescription className="text-base text-gray-600">
                    Sign in to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="usernameOrEmail" className="text-sm font-medium text-gray-700">Username or Email</Label>
                      <Input
                        id="usernameOrEmail"
                        type="text"
                        {...loginForm.register("usernameOrEmail")}
                        placeholder="Enter username or email"
                        className="h-12 border-2 focus:border-primary"
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
                        placeholder="Enter password"
                        className="h-12 border-2 focus:border-primary"
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-500">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-primary hover:text-primary/80 font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-medium"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Register Form */}
            {!isLogin && (
              <Card className="shadow-lg border border-gray-200 bg-white rounded-xl">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl text-gray-900">Join TrueCircle</CardTitle>
                  <CardDescription className="text-base text-gray-600">
                    Create your account to start meeting people
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          {...registerForm.register("firstName")}
                          placeholder="First name"
                          className="h-12 border-2 focus:border-primary"
                        />
                        {registerForm.formState.errors.firstName && (
                          <p className="text-sm text-red-500">
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
                          className="h-12 border-2 focus:border-primary"
                        />
                        {registerForm.formState.errors.lastName && (
                          <p className="text-sm text-red-500">
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
                        className="h-12 border-2 focus:border-primary"
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
                        placeholder="you@example.com"
                        className="h-12 border-2 focus:border-primary"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-500">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Date of Birth</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          {...registerForm.register("dateOfBirth.month", { valueAsNumber: true })}
                          className="h-12 border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md focus:border-primary"
                        >
                          {months.map((month, index) => (
                            <option key={month} value={index + 1}>
                              {month}
                            </option>
                          ))}
                        </select>
                        <select
                          {...registerForm.register("dateOfBirth.day", { valueAsNumber: true })}
                          className="h-12 border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md focus:border-primary"
                        >
                          {days.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                        <select
                          {...registerForm.register("dateOfBirth.year", { valueAsNumber: true })}
                          className="h-12 border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md focus:border-primary"
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      {registerForm.formState.errors.dateOfBirth && (
                        <p className="text-sm text-red-500">
                          {registerForm.formState.errors.dateOfBirth.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-sm font-medium text-gray-700">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        {...registerForm.register("password")}
                        placeholder="Create password"
                        className="h-12 border-2 focus:border-primary"
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-500">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...registerForm.register("confirmPassword")}
                        placeholder="Confirm password"
                        className="h-12 border-2 focus:border-primary"
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-500">
                          {registerForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-gray-600 leading-relaxed">
                      By creating an account, you agree to our{' '}
                      <button
                        type="button"
                        className="text-primary hover:text-primary/80 font-medium underline"
                        onClick={() => setLocation('/terms')}
                      >
                        Terms of Service
                      </button>
                      {' '}and{' '}
                      <button
                        type="button"
                        className="text-primary hover:text-primary/80 font-medium underline"
                        onClick={() => setLocation('/privacy')}
                      >
                        Privacy Policy
                      </button>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-medium"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Join TrueCircle"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}