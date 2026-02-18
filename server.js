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

const app = express();

// ========================================
// CORS Configuration
// ========================================
const corsOptions = {
  origin: [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:5173",
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
      auth: "/workerscheduling-t1/api/auth",
      users: "/workerscheduling-t1/api/users",
      admin: "/workerscheduling-t1/api/admin",
      businessAreas: "/workerscheduling-t1/api/business-areas",
      jobRoles: "/workerscheduling-t1/api/job-roles",
      sessions: "/workerscheduling-t1/api/sessions"
    }
  });
});

// ========================================
// API Routes - ALL under /workerscheduling-t1/api
// ========================================
const apiRouter = express.Router();

// Mount all route modules on the API router
apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/business-areas", businessAreaRoutes);
apiRouter.use("/job-roles", jobRoleRoutes);
apiRouter.use("/sessions", sessionRoutes);

// Mount the API router at the base path
app.use("/workerscheduling-t1/api", apiRouter);

// Keep the old routes for backwards compatibility if needed
app.use("/workerscheduling-t1/api", routes);

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