import archiver from "archiver";
import type { GeneratedFile } from "./generator";
import type { Response } from "express";

/**
 * Stream generated files as a ZIP to the client
 */
export function streamZip(
  res: Response,
  files: GeneratedFile[],
  projectName: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create ZIP archive
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    // Set response headers
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${projectName}.zip"`
    );

    // Pipe archive to response
    archive.pipe(res);

    // Handle errors
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      reject(err);
    });

    archive.on("warning", (err) => {
      if (err.code === "ENOENT") {
        console.warn("Archive warning:", err);
      } else {
        reject(err);
      }
    });

    // Handle completion
    archive.on("end", () => {
      console.log(
        `✅ Generated ${projectName}.zip (${archive.pointer()} bytes)`
      );
      resolve();
    });

    // Add files to archive
    files.forEach((file) => {
      archive.append(file.content, { name: `${projectName}/${file.path}` });
    });

    // Finalize archive
    archive.finalize();
  });
}
