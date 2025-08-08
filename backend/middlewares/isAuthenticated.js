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
  if (!token) {
    return res.status(401).json({ message: "Unauthorized. Token missing." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Use decoded.userId for compatibility with most JWT payloads
    const user = await User.findById(decoded.userId || decoded._id);

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ message: "Unauthorized. Token invalid." });
  }
};

export default isAuthenticated;
export const protect = isAuthenticated;



