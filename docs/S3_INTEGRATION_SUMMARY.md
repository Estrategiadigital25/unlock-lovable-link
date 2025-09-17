# AWS S3 Integration - Implementation Summary & Testing Guide

## ✅ What Has Been Implemented

### 1. **AWS Lambda Function** (`aws-lambda/presigned-url-generator.js`)

- Generates presigned URLs for secure S3 file uploads
- Handles file validation (type, size)
- Organizes files by user and GPT ID
- Supports CORS for web requests
- Returns both upload URL and access URL

### 2. **Updated TrainingFilesDropzone Component**

- **Smart Mode Detection**: Automatically detects mock vs real upload mode
- **Real S3 Uploads**: When `VITE_PRESIGN_ENDPOINT` is configured
- **Mock Mode**: When endpoint is not configured (shows warning)
- **User Context**: Includes user email and GPT ID for organized file storage
- **Better Error Handling**: Detailed error messages and progress tracking

### 3. **Environment Configuration**

- Added S3 configuration variables to `.env`
- Clear comments for setup instructions
- Optional configuration for S3 bucket details

### 4. **File Organization Structure**

Files are organized in S3 as:

```
your-bucket/
├── users/
│   └── user@iespecialidades.com/
│       └── gpts/
│           └── gpt-123/
│               ├── training-file-1.pdf
│               └── training-file-2.png
└── general/
    └── shared-files/
```

## 🧪 Testing Guide

### Phase 1: Test Current Mock Mode

1. **Ensure no PRESIGN_ENDPOINT is set**:

   ```bash
   # In .env file, keep this commented:
   # VITE_PRESIGN_ENDPOINT="..."
   ```

2. **Test file upload**:
   - Go to your app
   - Click "Crear GPT" (or wherever TrainingFilesDropzone appears)
   - Try uploading a file
   - Should see: "Archivos simulados - Configura VITE_PRESIGN_ENDPOINT para subida real"

### Phase 2: Deploy AWS Infrastructure

#### Step 1: Create S3 Bucket

```bash
# Replace with your preferred bucket name and region
aws s3 mb s3://ingtec-ai-training-files --region us-east-1
```

#### Step 2: Configure S3 CORS

Create a file `cors.json`:

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

Apply CORS:

```bash
aws s3api put-bucket-cors --bucket ingtec-ai-training-files --cors-configuration file://cors.json
```

#### Step 3: Create IAM Role for Lambda

Create trust policy (`trust-policy.json`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Create IAM role:

```bash
aws iam create-role --role-name lambda-s3-role --assume-role-policy-document file://trust-policy.json
```

Attach basic execution policy:

```bash
aws iam attach-role-policy --role-name lambda-s3-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

Create S3 permissions policy (`s3-policy.json`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl", "s3:GetObject"],
      "Resource": "arn:aws:s3:::ingtec-ai-training-files/*"
    }
  ]
}
```

Create and attach S3 policy:

```bash
aws iam create-policy --policy-name lambda-s3-policy --policy-document file://s3-policy.json
aws iam attach-role-policy --role-name lambda-s3-role --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/lambda-s3-policy
```

#### Step 4: Deploy Lambda Function

```bash
cd aws-lambda
npm install
npm run package

# Get your account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create Lambda function
aws lambda create-function \
  --function-name ingtec-presigned-url-generator \
  --runtime nodejs18.x \
  --role arn:aws:iam::$ACCOUNT_ID:role/lambda-s3-role \
  --handler presigned-url-generator.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 128

# Set environment variables
aws lambda update-function-configuration \
  --function-name ingtec-presigned-url-generator \
  --environment Variables='{BUCKET_NAME=ingtec-ai-training-files,REGION=us-east-1}'

# Create Function URL
aws lambda create-function-url-config \
  --function-name ingtec-presigned-url-generator \
  --cors AllowCredentials=false,AllowHeaders="*",AllowMethods="*",AllowOrigins="*" \
  --auth-type NONE
```

This will return a Function URL like: `https://abc123def456.lambda-url.us-east-1.on.aws/`

#### Step 5: Update Environment Configuration

Add to your `.env` file:

```env
VITE_PRESIGN_ENDPOINT="https://your-function-url.lambda-url.us-east-1.on.aws/"
```

### Phase 3: Test Real S3 Integration

1. **Restart your development server**:

   ```bash
   npm run dev
   ```

2. **Test file upload**:

   - Upload a file through your app
   - Should see: "X archivo(s) subido(s) exitosamente a S3"
   - Check AWS S3 console to verify file was uploaded

3. **Test different scenarios**:
   - Upload different file types (PDF, images, documents)
   - Test file size limits
   - Test with different users (if user email varies)

### Phase 4: Verify File Organization

Check S3 bucket structure:

```bash
aws s3 ls s3://ingtec-ai-training-files/ --recursive
```

Should see files organized like:

```
users/user@iespecialidades.com/gpts/test-gpt-123/1234567890_abc123_document.pdf
users/user@iespecialidades.com/files/1234567890_def456_image.png
```

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**:

   - Verify S3 CORS configuration
   - Check Lambda Function URL CORS settings

2. **Permission Denied**:

   - Verify IAM role has correct S3 permissions
   - Check bucket name in Lambda environment variables

3. **Upload Fails**:

   - Check file size limits (25MB default)
   - Verify file type is supported
   - Check Lambda function logs

4. **Function URL Not Working**:
   - Ensure Function URL is created and auth-type is NONE
   - Verify the URL in your .env file

### Monitoring

- **CloudWatch Logs**: Check Lambda function logs for errors
- **S3 Access Logs**: Enable for detailed upload monitoring
- **Browser DevTools**: Check network tab for failed requests

## 🎯 Next Steps

1. **Production Security**:

   - Implement API authentication
   - Restrict CORS to your domain only
   - Add request rate limiting

2. **Cost Optimization**:

   - Set up S3 lifecycle policies
   - Monitor Lambda invocation costs
   - Consider using S3 Transfer Acceleration

3. **Enhanced Features**:
   - File preview functionality
   - Batch upload support
   - File sharing between users

## 📝 Important Notes

- **Warning Removal**: The warning "⚠️ VITE_PRESIGN_ENDPOINT no configurado" will disappear once you set the environment variable
- **File Access**: Uploaded files can be accessed via the `accessUrl` returned by the Lambda function
- **Security**: Presigned URLs expire after 15 minutes for uploads and 24 hours for access
- **Backup**: Consider enabling S3 versioning for file backup
