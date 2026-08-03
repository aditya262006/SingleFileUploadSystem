
const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    fileName: {
      type:     String,
      required: true,       
    },
    originalName: {
      type:     String,
      required: true,       
    },
    blobUrl: {
      type:     String,
      required: true,       
    },
    fileSize: {
      type:   Number,       
      required: true,
    },
    mimeType: {
      type:     String,
      required: true,
    },
  },
  {
    timestamps: true,       
  }
);

module.exports = mongoose.model("File", fileSchema);
