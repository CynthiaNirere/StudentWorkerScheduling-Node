import routes from "./app/routes/index.js";
import express from "express";
import cors from "cors";
import db from "./app/models/index.js";

import authRoutes from "./app/routes/auth.routes.js";
import userRoutes from "./app/routes/user.routes.js";
import adminRoutes from "./app/routes/admin.routes.js";
import businessAreaRoutes from "./app/routes/businessArea.routes.js";
import jobRoleRoutes from "./app/routes/jobRole.routes.js";
import sessionRoutes from "./app/routes/session.routes.js";

// Sync database
db.sequelize.sync();

const app = express();

// ========================================
// CORS Configuration
// ========================================
const corsOptions = {
  origin: [
    "http://localhost:8081",
    "https://workerscheduling.eaglesoftwareteam.com",
    "https://workerscheduling.eaglesoftwareteam.com:3131"
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ["Content-Type", "Authorization", "x-requested-with"],
  credentials: true,
};

app.use(cors(corsOptions));

// ========================================
// Body Parsers
// ========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================================
// Request Logging Middleware
// ========================================
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ========================================
// ROOT ROUTE - API Health Check
// ========================================
app.get("/", (req, res) => {
  res.json({ 
    message: "Worker Scheduling API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      api: "/workerscheduling-t1",
      auth: "/api/auth",
      users: "/api/users",
      admin: "/api/admin",
      businessAreas: "/api/business-areas",
      jobRoles: "/api/job-roles",
      sessions: "/api/sessions"
    }
  });
});

// ========================================
// API Routes
// ========================================
app.use("/workerscheduling-t1/api", routes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/business-areas", businessAreaRoutes);
app.use("/api/job-roles", jobRoleRoutes);
app.use("/api/sessions", sessionRoutes);

// ========================================
// 404 Handler
// ========================================
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.path,
    method: req.method
  });
});

// ========================================
// Error Handler
// ========================================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server
const PORT = process.env.PORT || 3131;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
  });
}

export default app;