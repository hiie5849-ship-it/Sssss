import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

export const zipRouter = Router();

function addDirectoryToZip(zip: JSZip, localPath: string, zipPath: string) {
  const entries = fs.readdirSync(localPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullLocalPath = path.join(localPath, entry.name);
    const fullZipPath = zipPath ? `${zipPath}/${entry.name}` : entry.name;

    // Ignore heavy or temporary directories
    if (['node_modules', '.git', 'dist', '.data', '.aistudio', '.cache'].includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      const subZip = zip.folder(fullZipPath);
      if (subZip) {
        addDirectoryToZip(zip, fullLocalPath, fullZipPath);
      }
    } else if (entry.isFile()) {
      try {
        const fileContent = fs.readFileSync(fullLocalPath);
        zip.file(fullZipPath, fileContent);
      } catch (err) {
        console.error(`Skipping file ${fullLocalPath}:`, err);
      }
    }
  }
}

// GET /api/download-project-zip - Generates and downloads real project ZIP
zipRouter.get('/download-project-zip', async (req, res) => {
  try {
    const zip = new JSZip();
    const rootDir = process.cwd();

    addDirectoryToZip(zip, rootDir, '');

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="zappkart-marketplace-source.zip"');
    res.setHeader('Content-Length', zipBuffer.length);
    res.send(zipBuffer);
  } catch (err: any) {
    console.error('Error generating project zip:', err);
    res.status(500).json({ error: 'Failed to generate project archive.' });
  }
});
