import routes from "./app/routes/index.js";
import express from "express";
import cors from "cors";
import db from "./app/models/index.js";

// Database tables are managed via team SQL schema — do not use sync()
// db.sequelize.sync();

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
  console.log(`${req.method} ${req.path}`); // FIXED
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
      auth: "/workerscheduling-t1/api/auth",
      users: "/workerscheduling-t1/api/users",
      schedules: "/workerscheduling-t1/api/schedules",
      availabilities: "/workerscheduling-t1/api/availabilities",
      clock: "/workerscheduling-t1/api/clock"
    }
  });
});

// ========================================
// API Routes
// ========================================
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
    console.log(`✅ Server is running on port ${PORT}`); // FIXED
  });
}

export default app;