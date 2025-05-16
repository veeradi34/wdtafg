import passport from "passport";
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import express from "express";
import session from "express-session";

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "/api/auth/google/callback"
}, (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
  // Here, you would find or create the user in your DB
  // For demo, just pass the profile
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj as any);
});

export function setupAuth(app: express.Express) {
  app.use(session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // set to true in production with HTTPS
      sameSite: "lax"
    }
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  // Start Google OAuth
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  // Google OAuth callback
  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
      // On success, redirect to frontend home page
      res.redirect("http://localhost:5173/app");
    }
  );

  // Logout
  app.get("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  // Endpoint to get current user
  app.get("/api/auth/user", (req, res) => {
    res.json(req.user || null);
  });
}

// If you see a type error for 'passport-google-oauth20', run:
// npm install --save-dev @types/passport-google-oauth20 