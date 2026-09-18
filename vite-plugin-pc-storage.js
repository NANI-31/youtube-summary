import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";

/**
 * Sanitize folder/file names for Windows and Unix file systems.
 */
function sanitizeName(name) {
  if (!name) return "Untitled";
  return name.replace(/[<>:"/\\|?*]/g, "_").trim();
}

/**
 * Formats a markdown file with clean YAML frontmatter for metadata.
 */
function formatMarkdownWithFrontmatter(file) {
  const frontmatter = [
    "---",
    `id: "${file.id}"`,
    `name: "${file.name}"`,
    file.youtubeUrl ? `youtubeUrl: "${file.youtubeUrl}"` : null,
    file.youtubeVideoId ? `youtubeVideoId: "${file.youtubeVideoId}"` : null,
    file.youtubeTitle
      ? `youtubeTitle: "${file.youtubeTitle.replace(/"/g, '\\"')}"`
      : null,
    `createdAt: "${file.createdAt || new Date().toISOString()}"`,
    `updatedAt: "${file.updatedAt || new Date().toISOString()}"`,
    "---",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  // If file.content already has frontmatter, strip it before appending
  let content = file.content || "";
  if (content.startsWith("---\n")) {
    const secondDelim = content.indexOf("\n---\n", 4);
    if (secondDelim !== -1) {
      content = content.slice(secondDelim + 5);
    }
  }

  return `${frontmatter}\n${content.trim()}\n`;
}

/**
 * Vite plugin that implements a local PC file system storage backend.
 * Saves raw application database to `./data/storage.json` AND
 * synchronizes actual folders and `.md` files to `./notes/` on the PC hard drive.
 */
export function pcStoragePlugin() {
  const projectRoot = process.cwd();
  const dataDir = path.join(projectRoot, "data");
  const notesDir = path.join(projectRoot, "notes");
  const storageJsonPath = path.join(dataDir, "storage.json");
  const settingsJsonPath = path.join(dataDir, "settings.json");

  // Ensure base directories exist on disk
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(notesDir)) fs.mkdirSync(notesDir, { recursive: true });

  /**
   * Synchronize the folder hierarchy and markdown files on the PC disk.
   */
  async function syncNotesToDisk(collections, files) {
    const writtenFiles = new Set();
    const writtenDirs = new Set();
    writtenDirs.add(notesDir);

    // Recursively write collections as directories
    async function writeCollection(col, currentDirPath) {
      const colDirName = sanitizeName(col.name);
      const colDirPath = path.join(currentDirPath, colDirName);
      await fsp.mkdir(colDirPath, { recursive: true });
      writtenDirs.add(colDirPath);

      // Write markdown files belonging to this collection
      const fileIds = col.fileIds || [];
      for (const fileId of fileIds) {
        const file = files[fileId];
        if (!file) continue;

        const safeFileName = sanitizeName(
          file.name.endsWith(".md") ? file.name : `${file.name}.md`,
        );
        const filePath = path.join(colDirPath, safeFileName);
        const fileContent = formatMarkdownWithFrontmatter(file);

        await fsp.writeFile(filePath, fileContent, "utf-8");
        writtenFiles.add(filePath);
      }

      // Recursively process child collections
      for (const child of col.children || []) {
        await writeCollection(child, colDirPath);
      }
    }

    for (const col of collections) {
      await writeCollection(col, notesDir);
    }

    // Clean up files or directories in notesDir that are no longer in state
    async function cleanOldEntries(dir) {
      try {
        const entries = await fsp.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await cleanOldEntries(fullPath);
            if (!writtenDirs.has(fullPath)) {
              try {
                await fsp.rm(fullPath, { recursive: true, force: true });
              } catch {
                /* ignore */
              }
            }
          } else if (entry.isFile()) {
            if (!writtenFiles.has(fullPath)) {
              try {
                await fsp.unlink(fullPath);
              } catch {
                /* ignore */
              }
            }
          }
        }
      } catch {
        /* ignore */
      }
    }

    await cleanOldEntries(notesDir);
  }

  return {
    name: "vite-plugin-pc-storage",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0];

        // 1. GET /api/storage - Read stored data from PC
        if (url === "/api/storage" && req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          try {
            if (fs.existsSync(storageJsonPath)) {
              const content = await fsp.readFile(storageJsonPath, "utf-8");
              const parsed = JSON.parse(content);
              return res.end(
                JSON.stringify({
                  ...parsed,
                  storagePath: notesDir,
                  source: "pc-disk",
                }),
              );
            }
            return res.end(
              JSON.stringify({
                collections: [],
                files: {},
                storagePath: notesDir,
                source: "empty",
              }),
            );
          } catch (err) {
            return res.end(
              JSON.stringify({
                error: err.message,
                collections: [],
                files: {},
                storagePath: notesDir,
              }),
            );
          }
        }

        // 2. POST /api/storage - Save data to PC (storage.json + real .md files)
        if (url === "/api/storage" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            res.setHeader("Content-Type", "application/json");
            try {
              const data = JSON.parse(body);
              const collections = Array.isArray(data.collections)
                ? data.collections
                : [];
              const files =
                typeof data.files === "object" && data.files !== null
                  ? data.files
                  : {};
              const settings =
                typeof data.settings === "object" && data.settings !== null
                  ? data.settings
                  : null;

              // Write JSON database
              await fsp.writeFile(
                storageJsonPath,
                JSON.stringify({ collections, files }, null, 2),
                "utf-8",
              );

              // Write settings if provided
              if (settings) {
                await fsp.writeFile(
                  settingsJsonPath,
                  JSON.stringify(settings, null, 2),
                  "utf-8",
                );
              }

              // Sync real Markdown files & folders to notes/
              await syncNotesToDisk(collections, files);

              res.statusCode = 200;
              return res.end(
                JSON.stringify({
                  success: true,
                  message: "Successfully saved to PC disk",
                  storagePath: notesDir,
                  fileCount: Object.keys(files).length,
                  collectionCount: collections.length,
                }),
              );
            } catch (err) {
              res.statusCode = 500;
              return res.end(
                JSON.stringify({
                  success: false,
                  error: err.message,
                }),
              );
            }
          });
          return;
        }

        // 3. GET /api/storage/info - Get PC storage location & status
        if (url === "/api/storage/info" && req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          const exists = fs.existsSync(storageJsonPath);
          return res.end(
            JSON.stringify({
              notesPath: notesDir,
              dataPath: dataDir,
              isSaved: exists,
              platform: process.platform,
            }),
          );
        }

        // 4. POST /api/storage/open-folder - Reveal notes directory in Windows File Explorer
        if (url === "/api/storage/open-folder" && req.method === "POST") {
          res.setHeader("Content-Type", "application/json");
          try {
            if (process.platform === "win32") {
              exec(`explorer "${notesDir}"`);
            } else if (process.platform === "darwin") {
              exec(`open "${notesDir}"`);
            } else {
              exec(`xdg-open "${notesDir}"`);
            }
            return res.end(JSON.stringify({ success: true, path: notesDir }));
          } catch (err) {
            res.statusCode = 500;
            return res.end(
              JSON.stringify({ success: false, error: err.message }),
            );
          }
        }

        // 5. GET /api/settings - Read settings from PC
        if (url === "/api/settings" && req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          try {
            if (fs.existsSync(settingsJsonPath)) {
              const content = await fsp.readFile(settingsJsonPath, "utf-8");
              return res.end(content);
            }
            return res.end(JSON.stringify({}));
          } catch {
            return res.end(JSON.stringify({}));
          }
        }

        // 6. POST /api/settings - Save settings to PC
        if (url === "/api/settings" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            res.setHeader("Content-Type", "application/json");
            try {
              await fsp.writeFile(settingsJsonPath, body, "utf-8");
              return res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              return res.end(
                JSON.stringify({ success: false, error: err.message }),
              );
            }
          });
          return;
        }

        next();
      });
    },
  };
}
