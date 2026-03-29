import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { env } from "./env.js";

// Cloudflare R2 is S3-compatible, so we use the AWS S3 client pointed at the R2 endpoint
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads an image buffer to Cloudflare R2 and returns the public URL.
 * Files are stored under products/<vendorId>/<uuid>.<ext>
 */
export async function uploadProductImage(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
  vendorId: string,
): Promise<string> {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "jpg";
  const key = `products/${vendorId}/${randomUUID()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }),
  );

  return `${env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
}
