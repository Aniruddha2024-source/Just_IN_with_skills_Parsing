import multer from "multer";

const storage = multer.memoryStorage();
export const singleUpload = multer({storage}).single("file");




// ✅ Use diskStorage to save on server
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads"); // Save to /uploads folder
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     const filename = `${Date.now()}${ext}`;
//     cb(null, filename);
//   }
// });

// export const singleUpload = multer({ storage }).single("file");






// import multer from "multer";

// const storage = multer.memoryStorage();

// export const singleUpload = multer({ storage }).fields([
//   { name: "resumeFile", maxCount: 1 },
//   { name: "profilePhotoFile", maxCount: 1 },
// ]);



