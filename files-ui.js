const fs = require("fs");
const path = require("path");

function createFilesUiHandler(filesDir) {
  return (req, res) => {
    try {
      const entries = fs.readdirSync(filesDir);
      const files = entries
        .map((name) => {
          const filePath = path.join(filesDir, name);
          try {
            const stat = fs.statSync(filePath);
            if (!stat.isFile()) return null;
            return {
              name,
              size: stat.size,
              mtime: stat.mtime,
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => b.mtime - a.mtime);

      const rows = files
        .map((file) => {
          const escapedName = file.name
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          const mtimeStr = file.mtime.toLocaleString();
          const sizeKb = (file.size / 1024).toFixed(1);
          return `
          <tr>
            <td>${escapedName}</td>
            <td class="right">${mtimeStr}</td>
            <td class="right">${sizeKb} KB</td>
            <td><a href="/files/${encodeURIComponent(file.name)}" download>Download</a></td>
          </tr>
        `;
        })
        .join("");

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Files</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 960px;
      margin: 40px auto;
      background: #fff;
      padding: 24px 28px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    h1 {
      margin-top: 0;
      margin-bottom: 4px;
      font-size: 24px;
    }
    p.subtitle {
      margin-top: 0;
      color: #666;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      font-size: 14px;
    }
    th, td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e5e5;
    }
    th {
      text-align: left;
      background: #fafafa;
    }
    tr:nth-child(even) {
      background: #fafafa;
    }
    tr:hover {
      background: #f0f6ff;
    }
    td.right, th.right {
      text-align: right;
      white-space: nowrap;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .empty {
      margin-top: 16px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Files</h1>
    <p class="subtitle">Listing files from the server <code>files</code> directory. Timestamps are based on server time.</p>
    ${files.length === 0 ? '<p class="empty">No files found.</p>' : `
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th class="right">Last modified</th>
          <th class="right">Size</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    `}
  </div>
</body>
</html>`;

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (err) {
      console.error("Error rendering files UI:", err);
      res
        .status(500)
        .send("<h1>Internal Server Error</h1><p>Failed to render files UI.</p>");
    }
  };
}

module.exports = {
  createFilesUiHandler,
};

