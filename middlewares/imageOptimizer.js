import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

// Optimize image under 1MB, max width 640px
export async function optimizeImage(inputPath) {
  try {
    let quality = 80;

    // Temporary path in the same folder
    const tempPath = path.join(
      path.dirname(inputPath),
      "tmp-" + path.basename(inputPath)
    );
    console.log(tempPath);

    let buffer = await sharp(inputPath)
      .resize({ width: 640, withoutEnlargement: true })
      .toFormat("jpeg", { quality })
      .toBuffer();

    // Reduce quality until < 1MB
    while (buffer.length > 1024 * 1024 && quality > 30) {
      quality -= 10;
      buffer = await sharp(inputPath)
        .resize({ width: 640, withoutEnlargement: true })
        .toFormat("jpeg", { quality })
        .toBuffer();
    }

    // Write optimized image to temp
    await fs.writeFile(tempPath, buffer);

    // Replace original file with optimized file
    await fs.rename(tempPath, inputPath);
  } catch (err) {
    console.error("Error optimizing image:", err);
    throw err;
  }
}
