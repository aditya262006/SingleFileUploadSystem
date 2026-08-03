const express = require("express");
const router  = express.Router();
const { put, del } = require("@vercel/blob");

const upload  = require("../middleware/multerConfig");
const File    = require("../models/File");

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    // Upload to Vercel Blob
    const blob = await put(req.file.originalname, req.file.buffer, {
      access: "public",
      contentType: req.file.mimetype,
    });

    const newFile = new File({
      fileName:     blob.pathname,
      originalName: req.file.originalname,
      blobUrl:      blob.url,
      fileSize:     req.file.size,
      mimeType:     req.file.mimetype,
    });

    await newFile.save();

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully!",
      file:    newFile,
    });
  } catch (error) {
    console.error("Upload error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/files", async (req, res) => {
  try {
    const { search, sort, order, type } = req.query;
    let query = {};

    if (search) {
      query.originalName = { $regex: search, $options: "i" };
    }

    if (type) {
      const typeMap = {
        image:    /^image\//,
        document: /^application\/(pdf|msword|vnd\.openxmlformats|vnd\.ms-)/,
        archive:  /^application\/(zip|x-zip|x-rar|x-7z)/,
        media:    /^(audio|video)\//,
        text:     /^(text\/|application\/json)/,
      };
      if (typeMap[type]) {
        query.mimeType = { $regex: typeMap[type] };
      }
    }

    // Sort
    let sortObj = { createdAt: -1 }; // default: newest first
    if (sort) {
      const dir = order === "asc" ? 1 : -1;
      const sortMap = {
        name: { originalName: dir },
        size: { fileSize: dir },
        date: { createdAt: dir },
        type: { mimeType: dir },
      };
      if (sortMap[sort]) sortObj = sortMap[sort];
    }

    const files = await File.find(query).sort(sortObj);
    return res.status(200).json({ success: true, files });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const files = await File.find();
    const totalFiles = files.length;
    const totalSize  = files.reduce((sum, f) => sum + f.fileSize, 0);

    const breakdown = { image: 0, document: 0, archive: 0, media: 0, text: 0, other: 0 };
    const breakdownSize = { image: 0, document: 0, archive: 0, media: 0, text: 0, other: 0 };

    files.forEach(f => {
      const mime = f.mimeType;
      let cat = "other";
      if (mime.startsWith("image/")) cat = "image";
      else if (/^application\/(pdf|msword|vnd\.)/.test(mime)) cat = "document";
      else if (/^application\/(zip|x-zip|x-rar|x-7z)/.test(mime)) cat = "archive";
      else if (/^(audio|video)\//.test(mime)) cat = "media";
      else if (/^(text\/|application\/json)/.test(mime)) cat = "text";

      breakdown[cat]++;
      breakdownSize[cat] += f.fileSize;
    });

    return res.status(200).json({
      success: true,
      stats: { totalFiles, totalSize, breakdown, breakdownSize },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/files/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found." });
    }

    // Redirect to Blob URL
    return res.redirect(file.blobUrl);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/files/:id/preview ────────────────
router.get("/files/:id/preview", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found." });
    }

    // Redirect to Blob URL for preview
    return res.redirect(file.blobUrl);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/files/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found." });
    }

    // Delete from Vercel Blob
    try {
      await del(file.blobUrl);
    } catch (err) {
      console.warn("Failed to delete from Blob:", err.message);
    }

    await File.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, message: "File deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
