import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { sendEmail, generateVerificationEmail, generatePasswordResetEmail } from "./emailService";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      dateOfBirth: Date | null;
      age: number | null;
      isEmailVerified: boolean;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function setupAuth(app: Express) {
  const PostgresStore = connectPg(session);
  const sessionStore = new PostgresStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "usernameOrEmail",
        passwordField: "password",
      },
      async (usernameOrEmail, password, done) => {
        try {
          const user = await storage.getUserByUsernameOrEmail(usernameOrEmail);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid credentials" });
          }
          if (!user.isEmailVerified) {
            return done(null, false, { message: "Please verify your email first" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register route
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, dateOfBirth, firstName, lastName } = req.body;

      // Calculate age from date of birth
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge = calculatedAge - 1;
      }

      // Validate age requirement (18-25)
      if (calculatedAge < 18 || calculatedAge > 25) {
        return res.status(400).json({ message: "Must be 18-25 years old" });
      }

      // Check if username or email already exists in confirmed users
      const existingByUsername = await storage.getUserByUsername(username);
      if (existingByUsername) {
        return res.status(400).json({ message: "Username taken" });
      }

      const existingByEmail = await storage.getUserByEmail(email);
      if (existingByEmail) {
        return res.status(400).json({ message: "Email in use" });
      }

      // Clean up any expired or failed pending registrations
      await storage.deletePendingRegistration(email);

      const hashedPassword = await hashPassword(password);
      const verificationCode = generateVerificationCode();
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      // Create pending registration instead of actual user
      await storage.createPendingRegistration({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        age: calculatedAge,
        verificationCode: verificationCode,
        verificationExpiry: expiryTime
      });

      // Send verification email with code
      const emailHtml = generateVerificationEmail(username, verificationCode);
      const emailSent = await sendEmail({
        to: email,
        subject: 'TrueCircle Email Verification Code',
        html: emailHtml
      });

      if (!emailSent) {
        console.error('Failed to send verification email to:', email);
      }

      // For development, also log the verification code for manual testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`Verification code for ${email}: ${verificationCode}`);
      }

      res.status(201).json({ 
        message: "Check email for verification code",
        email: email,
        emailSent: emailSent,
        verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Email verification route with code
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ message: "Email and verification code are required" });
      }

      const user = await storage.verifyEmailAndCreateUser(email, code);
      
      if (user) {
        res.json({ message: "Email verified! You can now log in.", verified: true });
      } else {
        res.status(400).json({ message: "Invalid code", verified: false });
      }
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Verification failed", verified: false });
    }
  });

  // Resend verification code route
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if there's a pending registration for this email
      const pendingReg = await storage.getPendingRegistrationByEmail(email);
      if (!pendingReg) {
        return res.status(404).json({ message: "No pending registration found for this email" });
      }

      // Generate new verification code
      const verificationCode = generateVerificationCode();
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      // Update the pending registration with new code
      await storage.updatePendingRegistrationCode(email, verificationCode, expiryTime);

      // Send verification email with new code
      const emailHtml = generateVerificationEmail(pendingReg.username || 'User', verificationCode);
      const emailSent = await sendEmail({
        to: email,
        subject: 'TrueCircle Email Verification Code (Resent)',
        html: emailHtml
      });

      if (!emailSent) {
        console.error('Failed to resend verification email to:', email);
      }

      // For development, also log the verification code for manual testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`New verification code for ${email}: ${verificationCode}`);
      }

      res.json({ 
        message: "Verification code resent! Please check your email.",
        emailSent: emailSent,
        verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification code" });
    }
  });

  // Login route
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      // Check if email is verified
      if (!user.isEmailVerified) {
        return res.status(401).json({ 
          message: "Please verify your email address before logging in. Check your inbox for the verification link." 
        });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ message: "Login successful", user: { ...user, password: undefined } });
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Forgot password route
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Return success anyway to avoid email enumeration
        return res.json({ message: "If an account with that email exists, you will receive a password reset email." });
      }

      // Generate reset code and expiry
      const resetCode = generateVerificationCode();
      const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store reset code
      await storage.createPasswordReset({
        email: email,
        resetCode: resetCode,
        resetExpiry: resetExpiry,
      });

      // Send reset email
      const emailSent = await sendEmail({
        to: email,
        subject: "TrueCircle Password Reset",
        html: generatePasswordResetEmail(user.firstName || 'User', resetCode),
      });

      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send reset email" });
      }

      res.json({ 
        message: "If an account with that email exists, you will receive a password reset email.",
        email: email
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Reset password route
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      
      if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, code, and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Verify reset code and update password
      const success = await storage.verifyResetCodeAndUpdatePassword(email, code, hashedPassword);

      if (!success) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      res.json({ message: "Password reset successful. You can now log in with your new password." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export { hashPassword, comparePasswords };