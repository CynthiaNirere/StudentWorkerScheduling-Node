import db from "../models/index.js";

const Session = db.session;

const authenticate = (req, res, next) => {
  console.log("🔐 Authentication check for:", req.method, req.path);
  
  // ✅ ADDED: Allow demo mode bypass
  const isDemoMode = req.headers['x-demo-mode'] === 'true';
  
  if (isDemoMode) {
    console.log("👁️ Demo mode - bypassing authentication");
    req.user = {
      userId: 'demo-employer',
      isDemo: true
    };
    return next();
  }
  
  let authHeader = req.get("authorization");
  
  if (authHeader == null) {
    console.log("❌ No authorization header");
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
  
  Session.findOne({ 
    where: { 
      token: token, 
      isActive: 1
    } 
  })
    .then((session) => {
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
      
      req.user = {
        id: session.userId,
        userId: session.userId,
      };
      
      console.log("✅ User authenticated:", req.user);
      next();
    })
    .catch((err) => {
      console.error("❌ Authentication error:", err.message);
      return res.status(500).send({
        message: "Error authenticating user",
      });
    });
};

export default authenticate;