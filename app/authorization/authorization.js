import db from "../models/index.js";

const Session = db.session;

const authenticate = (req, res, next) => {
  let token = null;
 
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
  
  token = authHeader.slice(7);
  
  Session.findAll({ where: { token: token } })
    .then((data) => {
      if (!data || data.length === 0) {
        return res.status(401).send({
          message: "Unauthorized! Invalid Token",
        });
      }
      
      let session = data[0];
      console.log("Session expiration:", session.expirationDate);
      
      if (session.expirationDate >= Date.now()) {
        req.user = {
          userId: session.userId,
          email: session.email
        };
        
        console.log("User authenticated:", req.user);
        next();
      } else {
        return res.status(401).send({
          message: "Unauthorized! Expired Token, Logout and Login again",
        });
      }
    })
    .catch((err) => {
      console.error("Authentication error:", err.message);
      return res.status(500).send({
        message: "Error authenticating user",
      });
    });
};

export default authenticate;