const AWS = require('aws-sdk');

// Initialize S3 client
const s3 = new AWS.S3({
  region: process.env.REGION || 'us-east-1',
  signatureVersion: 'v4'
});

const BUCKET_NAME = process.env.BUCKET_NAME;
const UPLOAD_EXPIRATION = 900; // 15 minutes in seconds

// Allowed file types
const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg', 
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'text/plain',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
];

// Max file size: 25MB
const MAX_FILE_SIZE = 25 * 1024 * 1024;

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse the request body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON in request body'
        })
      };
    }

    const { fileName, fileType, fileSize, userEmail, gptId } = body;

    // Validate required fields
    if (!fileName || !fileType || !fileSize) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields: fileName, fileType, fileSize'
        })
      };
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(fileType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `File type ${fileType} not allowed`
        })
      };
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `File size ${fileSize} exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`
        })
      };
    }

    // Generate unique file key
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileName.split('.').pop();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Create organized file path
    let fileKey;
    if (userEmail && gptId) {
      // User-specific GPT file
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@.-]/g, '_');
      fileKey = `users/${sanitizedEmail}/gpts/${gptId}/${timestamp}_${randomId}_${sanitizedFileName}`;
    } else if (userEmail) {
      // User-specific file
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@.-]/g, '_');
      fileKey = `users/${sanitizedEmail}/files/${timestamp}_${randomId}_${sanitizedFileName}`;
    } else {
      // General file
      fileKey = `general/${timestamp}_${randomId}_${sanitizedFileName}`;
    }

    // Generate presigned URL parameters
    const presignedUrlParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Expires: UPLOAD_EXPIRATION,
      ContentType: fileType,
      ContentLength: fileSize,
      Conditions: [
        ['content-length-range', 0, MAX_FILE_SIZE],
        ['eq', '$Content-Type', fileType]
      ]
    };

    // Generate presigned URL for PUT operation
    const uploadUrl = await s3.getSignedUrlPromise('putObject', presignedUrlParams);

    // Generate a presigned URL for GET operation (for accessing the file later)
    const getUrlParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Expires: 86400 // 24 hours for file access
    };
    
    const accessUrl = await s3.getSignedUrlPromise('getObject', getUrlParams);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        uploadUrl,
        accessUrl,
        fileKey,
        bucket: BUCKET_NAME,
        expires: new Date(Date.now() + UPLOAD_EXPIRATION * 1000).toISOString()
      })
    };

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to generate upload URL'
      })
    };
  }
};
