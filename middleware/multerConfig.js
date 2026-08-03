
const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = function (req, file, cb) {
  const allowedTypes = [
 
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Text & Data
    "text/plain",
    "text/csv",
    "application/json",
    // Archives
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    // Media
    "audio/mpeg",
    "audio/wav",
    "video/mp4",
    "video/webm",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: Images, Documents, Archives, Audio, Video"), false);
  }
};

const upload = multer({
  storage:    storage,
  fileFilter: fileFilter,
  limits:     { fileSize: 25 * 1024 * 1024 },
});

module.exports = upload;
