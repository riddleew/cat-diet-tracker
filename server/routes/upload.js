const express = require('express');
const { handleUpload } = require('@vercel/blob/client');

const router = express.Router();

// Client-direct upload: the client calls @vercel/blob/client's `upload()` which
// hits this endpoint to negotiate a token, then uploads directly to Blob storage.
// This bypasses Vercel's serverless body size limit, so phone photos work.
router.post('/image', async (req, res) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'Image upload is not configured (missing BLOB_READ_WRITE_TOKEN)' });
  }
  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
        addRandomSuffix: true,
        maximumSizeInBytes: 15 * 1024 * 1024,
      }),
      // Webhook fired after the client finishes uploading. Required by handleUpload but
      // we don't need to do anything since the client receives the blob URL directly.
      onUploadCompleted: async () => {},
    });
    res.json(jsonResponse);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
