import db from "../models/index.js";

const Session = db.session;

const authenticate = (req, res, next) => {
  let authHeader = req.get("authorization");
  
  if (authHeader == null) {
    return res.status(401).send({
      message: "Unauthorized! No Auth Header",
    });
  }
  
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).send({
      message: "Unauthorized! Invalid Auth Header Format",
    });
  }
  
  const token = authHeader.slice(7);
  
  Session.findOne({ where: { token: token, isActive: 1 } })
    .then((session) => {
      if (!session) {
        return res.status(401).send({
          message: "Unauthorized! Invalid Token",
        });
      }
      
      // Check expiration (BIGINT timestamp)
      if (session.expiresAt && session.expiresAt < Date.now()) {
        return res.status(401).send({
          message: "Unauthorized! Expired Token, Logout and Login again",
        });
      }
      
      req.user = {
        userId: session.userId,
      };
      
      console.log("User authenticated:", req.user);
      next();
    })
    .catch((err) => {
      console.error("Authentication error:", err.message);
      return res.status(500).send({
        message: "Error authenticating user",
      });
    });
};

export default authenticate;