// // import jwt from 'jsonwebtoken';
// // import { User } from '../models/user.model.js';

// // const isAuthenticated = async (req, res, next) => {
// //   const token = req.cookies.token;
// //   if (!token) return res.status(401).json({ message: "Unauthorized. Token missing." });

// //   try {
// //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
// //     const user = await User.findById(decoded.userId); // ✅ FIXED

// //     if (!user) return res.status(401).json({ message: "User not found." });

// //     req.user = user; // ✅ Attach user to request
// //     next();
// //   } catch (err) {
// //     console.error("Auth Middleware Error:", err);
// //     res.status(401).json({ message: "Unauthorized. Token invalid." });
// //   }
// // };

// // export default isAuthenticated;


// // import jwt from 'jsonwebtoken';
// // import { User } from '../models/user.model.js';

// // const isAuthenticated = async (req, res, next) => {
// //   const token = req.cookies.token;

// //   if (!token) {
// //     return res.status(401).json({ message: "Unauthorized. Token missing." });
// //   }

// //   try {
// //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
// //     // ✅ Use userId here (not _id)
// //     const user = await User.findById(decoded.userId);

// //     if (!user) {
// //       return res.status(401).json({ message: "User not found." });
// //     }

// //     req.user = user; // 🟢 Attach user to req
// //     next();
// //   } catch (error) {
// //     console.error("Auth Middleware Error:", error);
// //     res.status(401).json({ message: "Unauthorized. Token invalid." });
// //   }
// // };

// // export default isAuthenticated;


import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.token;
  
  console.log("=== AUTH MIDDLEWARE DEBUG ===");
  console.log("Request origin:", req.get('origin'));
  console.log("All cookies:", req.cookies);
  console.log("Token from cookie:", token ? "✅ Present" : "❌ Missing");
  console.log("JWT_SECRET set:", process.env.JWT_SECRET ? "✅ Yes" : "❌ No");
  
  if (!token) {
    console.log("❌ REJECT: Token missing");
    return res.status(401).json({ message: "Unauthorized. Token missing." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified. Decoded:", { _id: decoded._id, userId: decoded.userId });
    
    // Use decoded.userId for compatibility with most JWT payloads
    const user = await User.findById(decoded.userId || decoded._id);
    console.log("User lookup result:", user ? `✅ Found user ${user._id}` : "❌ User not found");

    if (!user) {
      console.log("❌ REJECT: User not found");
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user;
    console.log("✅ ALLOW: User authenticated");
    next();
  } catch (error) {
    console.error("❌ Auth Middleware Error:", error.message);
    res.status(401).json({ message: "Unauthorized. Token invalid." });
  }
};

export default isAuthenticated;
export const protect = isAuthenticated;



