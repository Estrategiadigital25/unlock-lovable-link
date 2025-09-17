# AWS S3 Integration Setup Guide

This guide will help you set up AWS S3 for training file uploads in your Ingtec AI Assistant application.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured (optional but recommended)
- Basic understanding of AWS S3 and Lambda

## Step 1: Create S3 Bucket

1. **Go to AWS S3 Console**

   - Navigate to https://s3.console.aws.amazon.com/
   - Click "Create bucket"

2. **Bucket Configuration**

   ```
   Bucket name: ingtec-ai-training-files (or your preferred name)
   Region: us-east-1 (or your preferred region)
   Block Public Access: Keep all blocks enabled (recommended for security)
   Bucket Versioning: Enable (optional, for file history)
   Server-side encryption: Enable with S3 managed keys
   ```

3. **CORS Configuration**
   Add this CORS configuration to allow web uploads:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

## Step 2: Create IAM Policy for S3 Access

Create an IAM policy with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::ingtec-ai-training-files/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::ingtec-ai-training-files"
    }
  ]
}
```

## Step 3: Create Lambda Function for Presigned URLs

1. **Create new Lambda function**

   - Runtime: Node.js 18.x or later
   - Function name: `ingtec-presigned-url-generator`

2. **Add environment variables to Lambda**

   ```
   BUCKET_NAME=ingtec-ai-training-files
   REGION=us-east-1
   ```

3. **Attach IAM policy to Lambda execution role**
   - Attach the policy created in Step 2 to the Lambda execution role

## Step 4: Deploy Lambda Function

The Lambda function code will be provided in the next steps.

## Step 5: Create API Gateway (Optional)

If you want to use API Gateway:

1. Create a new REST API
2. Create a POST method
3. Set integration type to Lambda Function
4. Enable CORS

## Environment Variables for Your App

After setup, add these to your `.env` file:

```env
# AWS S3 Configuration
VITE_PRESIGN_ENDPOINT=https://your-lambda-url.amazonaws.com/
VITE_S3_BUCKET=ingtec-ai-training-files
VITE_S3_REGION=us-east-1
```

## Security Considerations

1. **Never expose AWS credentials in frontend code**
2. **Use presigned URLs with expiration times (recommended: 5-15 minutes)**
3. **Implement file type and size validation**
4. **Consider using AWS CloudFront for better performance**
5. **Enable S3 access logging for auditing**

## File Organization

Recommended S3 file structure:

```
ingtec-ai-training-files/
├── users/
│   └── {user-email}/
│       └── gpts/
│           └── {gpt-id}/
│               ├── document1.pdf
│               ├── image1.png
│               └── data.xlsx
└── shared/
    └── common-files/
```

## Troubleshooting

- **CORS Issues**: Ensure CORS is properly configured on S3 bucket
- **Permission Denied**: Check IAM policies and Lambda execution role
- **Upload Fails**: Verify presigned URL expiration and file size limits
- **File Not Found**: Check bucket name and file paths

## Cost Optimization

- Set up S3 lifecycle policies to archive old files
- Use S3 Intelligent Tiering for automatic cost optimization
- Monitor usage with AWS Cost Explorer
