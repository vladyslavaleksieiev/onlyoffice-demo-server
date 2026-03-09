require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const { createFilesUiHandler } = require("./files-ui");
const { Document, Packer, Paragraph } = require("docx");

const app = express();
const PORT = process.env.PORT || 3000;
const FILES_DIR = path.resolve(__dirname, "files");
const JWT_SECRET = process.env.JWT_SECRET || process.env.ONLYOFFICE_JWT_SECRET;

// Ensure files directory exists
if (!fs.existsSync(FILES_DIR)) {
  fs.mkdirSync(FILES_DIR, { recursive: true });
}

app.use(cors());

const logFormat =
  process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(logFormat));

app.use(express.json());

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * GET /files/:filename - Serve a document from the files directory.
 * Validates path to prevent directory traversal.
 */
app.get("/files/:filename", (req, res) => {
  const { filename } = req.params;
  if (!filename || filename.includes("..") || path.isAbsolute(filename)) {
    return res.status(400).json({ error: "Invalid filename" });
  }
  const filePath = path.join(FILES_DIR, filename);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(FILES_DIR))) {
    return res.status(400).json({ error: "Invalid filename" });
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).json({ error: "File not found" });
  }
  res.setHeader("Content-Type", DOCX_MIME);
  res.sendFile(filePath);
});

/**
 * GET /api/files - List files in the files directory as JSON.
 */
app.get("/api/files", (req, res) => {
  try {
    const entries = fs.readdirSync(FILES_DIR);
    const files = entries
      .map((name) => {
        const filePath = path.join(FILES_DIR, name);
        try {
          const stat = fs.statSync(filePath);
          if (!stat.isFile()) return null;
          return {
            name,
            size: stat.size,
            mtimeMs: stat.mtimeMs,
            mtime: stat.mtime,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.mtimeMs - a.mtimeMs);

    res.json(files);
  } catch (err) {
    console.error("Error listing files:", err);
    res.status(500).json({ error: "Failed to list files" });
  }
});

/**
 * POST /documents - Create a new empty docx with a random unique name.
 * No request body or query params. Returns the new filename.
 */
app.post("/documents", async (req, res) => {
  try {
    const filename = `${crypto.randomBytes(8).toString("hex")}.docx`;
    const filePath = path.join(FILES_DIR, filename);

    const doc = new Document({
      sections: [
        {
          children: [new Paragraph({})],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    res.status(201).json({ filename });
  } catch (err) {
    console.error("Error creating document:", err);
    res.status(500).json({ error: "Failed to create document" });
  }
});

/**
 * GET /files-ui - Simple HTML page to browse and download files.
 */
app.get("/files-ui", createFilesUiHandler(FILES_DIR));

/**
 * GET /editor-config - OnlyOffice editor config for the given file.
 * Query: filename (required), baseUrl (optional, e.g. http://localhost:4200).
 * When JWT_SECRET is set, responds with config.token (signed JWT) for the editor.
 */
app.get("/editor-config", (req, res) => {
  const filename = req.query.filename;
  const baseUrl = (req.query.baseUrl || "").replace(/\/$/, "") || process.env.PUBLIC_URL || `http://localhost:${PORT}`;

  if (!filename || typeof filename !== "string" || filename.includes("..") || path.isAbsolute(filename)) {
    return res.status(400).json({ error: "Invalid or missing filename" });
  }

  const filePath = path.join(FILES_DIR, filename);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(FILES_DIR)) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).json({ error: "File not found" });
  }

  const documentKey = path.basename(filename, path.extname(filename)) || filename;
  const config = {
    documentType: 'word',
    document: {
      fileType: "docx",
      key: documentKey,
      title: filename,
      url: `${baseUrl}/files/${encodeURIComponent(filename)}`,
      permissions: {
        edit: true,
        download: true,
        print: true,
      },
    },
    editorConfig: {
      mode: 'edit',
      callbackUrl: `${baseUrl}/callback`,
      user: {
        id: '1',
        name: 'John Doe'
      }
    },
  };

  if (JWT_SECRET) {
    config.token = jwt.sign(config, JWT_SECRET, { algorithm: "HS256" });
  }

  res.json(config);
});

/**
 * Resolve callback payload from JWT (body.token or Authorization Bearer) or raw body.
 * Returns { payload, errorResponse } where errorResponse is set on JWT verification failure.
 */
function resolveCallbackPayload(req) {
  const body = req.body || {};
  const sendError = (statusCode = 500) => ({
    payload: null,
    errorResponse: { statusCode, body: { error: 1 } },
  });

  if (!JWT_SECRET) {
    return { payload: body, errorResponse: null };
  }

  let token = null;
  if (typeof body.token === "string" && body.token.length > 0) {
    token = body.token;
  } else {
    const auth = req.headers.authorization;
    if (auth && typeof auth === "string" && auth.startsWith("Bearer ")) {
      token = auth.slice(7);
    }
  }

  if (!token) {
    return { payload: body, errorResponse: null };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const payload = decoded.payload != null ? decoded.payload : decoded;
    return { payload, errorResponse: null };
  } catch (err) {
    return sendError(401);
  }
}

/**
 * POST /callback - OnlyOffice callback handler.
 * On status 2 or 6, downloads the document from the given URL and overwrites the file.
 * Supports JWT: token in body or Authorization Bearer. Always responds { error: 0 } or { error: 1 }.
 */
app.post("/callback", async (req, res) => {
  const { payload, errorResponse } = resolveCallbackPayload(req);

  const sendSuccess = () => res.json({ error: 0 });
  const sendError = () => res.status(500).json({ error: 1 });

  if (errorResponse) {
    const statusCode = Number(errorResponse.statusCode) || 500;
    return res.status(statusCode).json(errorResponse.body);
  }

  const { status, key, url, filetype } = payload || {};

  if (status === undefined || key === undefined) {
    return sendError();
  }

  // Status 2 = document ready for saving, 6 = force save
  if (status === 2 || status === 6) {
    if (!url || !filetype) {
      return sendError();
    }
    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const ext = filetype.startsWith(".") ? filetype : `.${filetype}`;
      const filename = key.includes(".") ? key : `${key}${ext}`;
      if (
        filename.includes("..") ||
        path.isAbsolute(filename) ||
        !filename.trim()
      ) {
        return sendError();
      }
      const filePath = path.join(FILES_DIR, filename);
      const resolved = path.resolve(filePath);
      if (!resolved.startsWith(path.resolve(FILES_DIR))) {
        return sendError();
      }
      fs.writeFileSync(filePath, Buffer.from(response.data));
      return sendSuccess();
    } catch (err) {
      console.error("Callback save error:", err);
      return sendError();
    }
  }

  // Status 1, 4, etc. - acknowledge without saving
  return sendSuccess();
});

app.listen(PORT, () => {
  console.log(`Document server listening on port ${PORT}`);
});
