import multer from "multer";
// Upload configuration
const storage = multer.memoryStorage(); // store in memory, not disk
export const upload = multer({ storage });
