const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const resolveFilePath = require('./resolveFilePath');

// Check if Cloudflare R2 or AWS S3 is configured
const isS3Configured = () => {
  return !!(
    (process.env.S3_BUCKET || process.env.R2_BUCKET) &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
};

let s3ClientInstance = null;

function getS3Client() {
  if (s3ClientInstance) return s3ClientInstance;

  try {
    const { S3Client } = require('@aws-sdk/client-s3');
    const region = process.env.AWS_REGION || 'auto';
    const config = {
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    };

    // If Cloudflare R2, custom endpoint is required (e.g. https://<account_id>.r2.cloudflarestorage.com)
    if (process.env.R2_ENDPOINT || process.env.S3_ENDPOINT) {
      config.endpoint = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT;
    }

    s3ClientInstance = new S3Client(config);
    return s3ClientInstance;
  } catch (err) {
    console.warn('[STORAGE] S3 SDK not loaded, falling back to local filesystem:', err.message);
    return null;
  }
}

/**
 * Upload a document buffer to Cloudflare R2 / AWS S3 or fallback to local disk.
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - MIME type
 * @returns {Promise<{ filePath: string, fileName: string, storageType: 'cloud' | 'local', url?: string }>}
 */
exports.saveDocument = async (buffer, originalName, mimeType) => {
  const ext = path.extname(originalName || '').toLowerCase() || '.bin';
  const fileName = `${crypto.randomBytes(16).toString('hex')}${ext}`;

  if (isS3Configured()) {
    try {
      const client = getS3Client();
      if (client) {
        const { PutObjectCommand } = require('@aws-sdk/client-s3');
        const bucket = process.env.R2_BUCKET || process.env.S3_BUCKET;
        const key = `documents/${fileName}`;

        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: mimeType || 'application/octet-stream',
            ServerSideEncryption: 'AES256', // DPDP Act statutory encryption at rest
          })
        );

        return {
          fileName,
          filePath: key,
          storageType: 'cloud',
        };
      }
    } catch (err) {
      console.error('[STORAGE] Cloud upload error, falling back to local disk:', err.message);
    }
  }

  // Local fallback (development mode)
  const uploadDir = process.env.UPLOAD_PATH
    ? (path.isAbsolute(process.env.UPLOAD_PATH)
        ? process.env.UPLOAD_PATH
        : path.join(__dirname, '..', process.env.UPLOAD_PATH))
    : path.join(__dirname, '..', 'uploads');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const localFilePath = path.join(uploadDir, fileName);
  fs.writeFileSync(localFilePath, buffer);

  return {
    fileName,
    filePath: localFilePath,
    storageType: 'local',
  };
};

/**
 * Generate a secure download stream or pre-signed URL for a document.
 * @param {string} storedFilePath - Path stored in Document model
 * @param {string} originalName - Filename for attachment header
 * @param {string} mimeType - File mimeType
 * @returns {Promise<{ type: 'url' | 'stream', url?: string, stream?: any }>}
 */
exports.getDocumentAccess = async (storedFilePath, originalName, mimeType) => {
  if (isS3Configured() && storedFilePath && !storedFilePath.startsWith('/') && !storedFilePath.includes(':\\')) {
    try {
      const client = getS3Client();
      if (client) {
        const { GetObjectCommand } = require('@aws-sdk/client-s3');
        const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
        const bucket = process.env.R2_BUCKET || process.env.S3_BUCKET;

        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: storedFilePath,
          ResponseContentDisposition: `attachment; filename="${originalName}"`,
          ResponseContentType: mimeType || 'application/octet-stream',
        });

        // 15-minute temporary pre-signed URL
        const presignedUrl = await getSignedUrl(client, command, { expiresIn: 900 });
        return { type: 'url', url: presignedUrl };
      }
    } catch (err) {
      console.warn('[STORAGE] Failed to generate pre-signed URL:', err.message);
    }
  }

  // Local filesystem
  const resolved = resolveFilePath(storedFilePath);
  if (!resolved || !fs.existsSync(resolved)) {
    return { type: 'missing' };
  }

  return {
    type: 'stream',
    stream: fs.createReadStream(resolved),
    filePath: resolved,
  };
};

/**
 * Delete a document from S3/R2 or local filesystem.
 */
exports.deleteDocumentFile = async (storedFilePath) => {
  if (isS3Configured() && storedFilePath && !storedFilePath.startsWith('/') && !storedFilePath.includes(':\\')) {
    try {
      const client = getS3Client();
      if (client) {
        const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
        const bucket = process.env.R2_BUCKET || process.env.S3_BUCKET;
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storedFilePath }));
        return true;
      }
    } catch (err) {
      console.warn('[STORAGE] S3 delete error:', err.message);
    }
  }

  const resolved = resolveFilePath(storedFilePath);
  if (resolved && fs.existsSync(resolved)) {
    try {
      fs.unlinkSync(resolved);
      return true;
    } catch {}
  }
  return false;
};
