# FileVault — Single File Upload with Multer
### AWD Workshop · NIET 2026 · International Mobility Track
LIVE DEMO: https://singlefileuploadsystem.onrender.com/
---

## Project Structure

```
file-storage-app/
│
├── server.js                  ← Entry point (Express + MongoDB)
├── .env                       ← Environment variables (PORT, MONGO_URI)
├── package.json               ← Dependencies
│
├── middleware/
│   └── multerConfig.js        ← Multer storage, filter, size limit
│
├── models/
│   └── File.js                ← Mongoose schema (file metadata)
│
├── routes/
│   └── upload.js              ← REST API routes (upload, list, download, delete)
│
├── public/
│   └── index.html             ← Frontend UI (drag & drop, file list)
│
└── uploads/                   ← Uploaded files stored here (auto-created)
```

---

## Connection Map

```
index.html  ──[FormData POST]──▶  /api/upload
                                      │
                                  multerConfig.js
                                  (validate & save to /uploads)
                                      │
                                  routes/upload.js
                                  (save metadata to MongoDB)
                                      │
                                  models/File.js
                                  (Mongoose schema)
                                      │
                                  MongoDB (filestoragedb)
```

---

## Setup & Run

### 1. Install dependencies
```bash
cd file-storage-app
npm install
```

### 2. Start MongoDB
Make sure MongoDB is running locally:
```bash
mongod
```
Or update `MONGO_URI` in `.env` to use MongoDB Atlas.

### 3. Start the server
```bash
npm start          # production
npm run dev        # with nodemon (auto-restart)
```

### 4. Open in browser
```
http://localhost:5000
```

---

## API Endpoints

| Method | Endpoint          | Description          |
|--------|-------------------|----------------------|
| POST   | /api/upload       | Upload a single file |
| GET    | /api/files        | List all files       |
| GET    | /api/files/:id    | Download a file      |
| DELETE | /api/files/:id    | Delete a file        |

---

## Concepts Covered (AWD Schedule)
- ✅ Node.js + Express routing & middleware
- ✅ Multer for multipart/form-data
- ✅ MongoDB + Mongoose ODM (CRUD)
- ✅ RESTful API design
- ✅ Fetch API & FormData on frontend
- ✅ Error handling & HTTP status codes
- ✅ Full-stack integration (frontend ↔ backend ↔ database)
