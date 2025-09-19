import sharp from "sharp";

/**
 * Receives image buffer along with width and height, and returns a promise resolving to the cropped image buffer
 * @param file
 * @param width
 * @param height
 */
export const resizeImage = async (
  file: Buffer,
  width: number,
  height: number
): Promise<Buffer> => {
  // No try/catch needed because rethrowing does nothing
  return await sharp(file).resize(width, height).toBuffer();
};
