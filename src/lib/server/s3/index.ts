import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export interface S3UploadResult {
  url: string;
  key: string;
}

/**
 * Upload a file buffer to S3
 * @param buffer File buffer to upload
 * @param mimeType File MIME type (e.g., 'image/jpeg')
 * @param folder Optional folder prefix in S3 bucket
 * @returns Object containing the S3 URL and key
 */
export async function uploadToS3(
  buffer: Buffer,
  mimeType: string,
  folder: string = 'product-images'
): Promise<S3UploadResult> {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  // Generate unique filename
  const fileExtension = mimeType.split('/')[1] || 'jpg';
  const fileName = `${uuidv4()}.${fileExtension}`;
  const key = `${folder}/${fileName}`;

  // Upload to S3
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    },
  });

  await upload.done();

  // Construct the URL
  const url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

  return { url, key };
}

/**
 * Upload multiple files to S3
 * @param files Array of file buffers with their MIME types
 * @param folder Optional folder prefix in S3 bucket
 * @returns Array of upload results
 */
export async function uploadMultipleToS3(
  files: Array<{ buffer: Buffer; mimeType: string }>,
  folder: string = 'product-images'
): Promise<S3UploadResult[]> {
  const uploadPromises = files.map((file) =>
    uploadToS3(file.buffer, file.mimeType, folder)
  );

  return Promise.all(uploadPromises);
}
