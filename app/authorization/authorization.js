import db from "../models/index.js";

const Session = db.session;
const User = db.user;

const authenticate = async (req, res, next) => {
  console.log("🔐 Authentication check for:", req.method, req.path);
  
  // ✅ Check for demo mode FIRST
  const isDemoMode = req.headers['x-demo-mode'] === 'true';
  
  if (isDemoMode) {
    console.log("👁️ Demo mode - bypassing authentication");
    req.user = {
      userId: 'demo-employer',
      isDemo: true
    };
    return next();
  }
  
  // ✅ NEW: Check for user info in headers (for Google OAuth users)
  const userId = req.headers['x-user-id'];
  const userEmail = req.headers['x-user-email'];
  const userRole = req.headers['x-user-role'];
  
  if (userId && userEmail) {
    console.log("✅ User info from headers:", { userId, userEmail, userRole });
    
    try {
      // Verify user exists in database
      const user = await User.findOne({ 
        where: { id: userId },
        attributes: { exclude: ['password_hash'] }
      });
      
      if (!user) {
        console.log("❌ User not found in database:", userId);
        return res.status(401).send({
          message: "Unauthorized! User not found",
        });
      }
      
      // Attach user to request
      req.user = {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        work_location: user.work_location
      };
      
      console.log("✅ User authenticated from headers:", req.user);
      return next();
      
    } catch (err) {
      console.error("❌ Error verifying user:", err);
      return res.status(500).send({
        message: "Error authenticating user",
      });
    }
  }
  
  // ✅ FALLBACK: Check for Bearer token (for session-based auth)
  let authHeader = req.get("authorization");
  
  if (authHeader == null) {
    console.log("❌ No authorization header and no user headers");
    return res.status(401).send({
      message: "Unauthorized! No Auth Header",
    });
  }
  
  if (!authHeader.startsWith("Bearer ")) {
    console.log("❌ Invalid auth header format:", authHeader);
    return res.status(401).send({
      message: "Unauthorized! Invalid Auth Header Format",
    });
  }
  
  const token = authHeader.slice(7);
  console.log("🔍 Checking token:", token.substring(0, 30) + "...");
  
  try {
    const session = await Session.findOne({ 
      where: { 
        token: token, 
        isActive: 1
      } 
    });
    
    if (!session) {
      console.log("❌ No valid session found for token");
      return res.status(401).send({
        message: "Unauthorized! Invalid Token",
      });
    }
    
    console.log("✅ Session found for user:", session.userId);
    
    // Check expiration (BIGINT timestamp)
    if (session.expiresAt && session.expiresAt < Date.now()) {
      console.log("❌ Token expired");
      return res.status(401).send({
        message: "Unauthorized! Expired Token, Logout and Login again",
      });
    }
    
    // Get full user info from database
    const user = await User.findOne({ 
      where: { id: session.userId },
      attributes: { exclude: ['password_hash'] }
    });
    
    req.user = {
      id: session.userId,
      userId: session.userId,
      email: user?.email,
      role: user?.role,
      work_location: user?.work_location
    };
    
    console.log("✅ User authenticated from session:", req.user);
    next();
    
  } catch (err) {
    console.error("❌ Authentication error:", err.message);
    return res.status(500).send({
      message: "Error authenticating user",
    });
  }
};

export default authenticate;