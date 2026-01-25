import routes from "./app/routes/index.js";
import express from "express";
import cors from "cors";
import db from "./app/models/index.js";

// Sync database
db.sequelize.sync();

const app = express();

// ========================================
// CORS Configuration
// ========================================
const corsOptions = {
  origin: [
    "http://localhost:8081",
    "https://project3.eaglesoftwareteam.com",
    "https://project3.eaglesoftwareteam.com:3121"
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
  console.log(`${req.method} ${req.path}`); // FIXED
  next();
});

// ========================================
// ROOT ROUTE - API Health Check
// ========================================
app.get("/", (req, res) => {
  res.json({ 
    message: "Exercise Tracker API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      api: "/tracker-t1",
      auth: "/tracker-t1/api/auth",
      users: "/tracker-t1/api/users",
      athletes: "/tracker-t1/api/athletes",
      coaches: "/tracker-t1/api/coach",
      exercises: "/tracker-t1/api/exercises",
      plans: "/tracker-t1/api/exercise-plans",
      goals: "/tracker-t1/api/goals"
    }
  });
});

// ========================================
// API Routes
// ========================================
app.use("/tracker-t1/api", routes);

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
const PORT = process.env.PORT || 3121;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`); // FIXED
  });
}

export default app;