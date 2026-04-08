import express from "express";
import cors from "cors";
import cron from 'node-cron';
import db from "./app/models/index.js";
import routes from "./app/routes/index.js";
import { resetDailyTasks } from './app/jobs/dailyTaskReset.js';

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:5173",
    "https://workerscheduling.eaglesoftwareteam.com",
    "https://workerscheduling-t1.eaglesoftwareteam.com",
    "https://project3.eaglesoftwareteam.com"
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
<<<<<<< HEAD
  allowedHeaders: ["Content-Type", "Authorization", "x-requested-with", "x-demo-mode", "x-user-id", "x-user-email", "x-user-role"],
=======
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-requested-with",
    "x-demo-mode",
    "x-user-id",
    "x-user-email",
    "x-user-role"
  ],
>>>>>>> 64cc8bf004f50b2775303586b2ad550bb17e3732
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight OPTIONS requests for all routes
app.options('*', cors(corsOptions));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ROOT ROUTE - API Health Check
app.get("/", (req, res) => {
  res.json({
    message: "Worker Scheduling API is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      base: "/workerscheduling-t1/api",
      auth: "/workerscheduling-t1/api/auth",
      users: "/workerscheduling-t1/api/users",
      shifts: "/workerscheduling-t1/api/shifts",
      businessAreas: "/workerscheduling-t1/api/business-areas",
      jobRoles: "/workerscheduling-t1/api/job-roles",
    }
  });
});

// API Routes
app.use("/workerscheduling-t1/api", routes);

// ── CRON JOB SETUP ────────────────────────────────────────────────────────

console.log("⏰ Setting up daily task reset cron job...");

cron.schedule('0 0 * * *', async () => {
  console.log('\n🕐 Midnight - Running daily task reset...');
  try {
    await resetDailyTasks();
  } catch (err) {
    console.error('❌ Cron job failed:', err);
  }
}, {
  timezone: "America/Chicago"
});

console.log("✅ Daily task reset cron job scheduled for midnight CST");

// Manual trigger endpoint for testing
app.post('/workerscheduling-t1/api/admin/trigger-task-reset', async (req, res) => {
  try {
    console.log('🔧 Manual task reset triggered by admin');
    const result = await resetDailyTasks();
    res.json({
      success: true,
      message: 'Task reset completed successfully',
      result
    });
  } catch (err) {
    console.error('Manual reset failed:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ── 404 Handler ───────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.path,
    method: req.method,
    availableRoutes: [
      "POST /workerscheduling-t1/api/auth/login",
      "GET /workerscheduling-t1/api/users",
      "GET /workerscheduling-t1/api/business-areas",
      "GET /workerscheduling-t1/api/shifts"
    ]
  });
});

// ── Error Handler ─────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ── Database Sync & Server Start ──────────────────────────────────────────

const PORT = process.env.PORT || 3131;

if (process.env.NODE_ENV !== "test") {
  db.sequelize.sync({ alter: false })
    .then(() => {
      console.log("✅ Database synced");
      app.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`);
        console.log(`📍 API Base: http://localhost:${PORT}/workerscheduling-t1/api`);
        console.log(`⏰ Cron job active - Daily task reset at midnight CST`);
      });
    })
    .catch(err => {
      console.error("❌ Database sync failed:", err);
    });
}

export default app;