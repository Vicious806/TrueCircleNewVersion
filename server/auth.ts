import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { sendEmail, generateVerificationEmail } from "./emailService";

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
  app.post("/api/register", async (req, res) => {
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



      // Validate age requirement
      if (calculatedAge < 18) {
        return res.status(400).json({ message: "You must be at least 18 years old to join" });
      }

      // Check if username or email already exists
      const existingByUsername = await storage.getUserByUsername(username);
      if (existingByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingByEmail = await storage.getUserByEmail(email);
      if (existingByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const verificationCode = generateVerificationCode();
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        age: calculatedAge,
        emailVerificationCode: verificationCode,
        emailVerificationExpiry: expiryTime
      });

      // Send verification email with code
      const emailHtml = generateVerificationEmail(username, verificationCode);
      const emailSent = await sendEmail({
        to: email,
        subject: 'Email Verification Code',
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
        message: "Registration successful! Please check your email for your verification code.",
        emailSent: emailSent,
        verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Email verification route with code
  app.post("/api/verify-email", async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ message: "Email and verification code are required" });
      }

      const verified = await storage.verifyEmailWithCode(email, code);
      
      if (verified) {
        res.json({ message: "Email verified successfully", verified: true });
      } else {
        res.status(400).json({ message: "Invalid or expired verification code", verified: false });
      }
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Verification failed", verified: false });
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
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
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });


}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export { hashPassword, comparePasswords };