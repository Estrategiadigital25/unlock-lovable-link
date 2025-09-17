# AWS Lambda Deployment Guide

## Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js and npm installed

## Quick Deployment Steps

### 1. Install Dependencies

```bash
cd aws-lambda
npm install
```

### 2. Create Deployment Package

```bash
npm run package
```

This creates `function.zip` with all necessary files.

### 3. Deploy via AWS CLI

```bash
# Create the Lambda function
aws lambda create-function \
  --function-name ingtec-presigned-url-generator \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-s3-role \
  --handler presigned-url-generator.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 128

# Set environment variables
aws lambda update-function-configuration \
  --function-name ingtec-presigned-url-generator \
  --environment Variables='{BUCKET_NAME=ingtec-ai-training-files,REGION=us-east-1}'
```

### 4. Create Function URL (for direct HTTP access)

```bash
aws lambda create-function-url-config \
  --function-name ingtec-presigned-url-generator \
  --cors AllowCredentials=false,AllowHeaders="*",AllowMethods="*",AllowOrigins="*" \
  --auth-type NONE
```

This will return a Function URL that you can use as your `VITE_PRESIGN_ENDPOINT`.

### 5. Alternative: Deploy via AWS Console

1. Go to AWS Lambda Console
2. Click "Create function"
3. Choose "Author from scratch"
4. Function name: `ingtec-presigned-url-generator`
5. Runtime: Node.js 18.x
6. Upload the `function.zip` file
7. Set environment variables:
   - `BUCKET_NAME`: your-bucket-name
   - `REGION`: your-aws-region
8. Configure Function URL in the Configuration tab

## Required IAM Role

Create an IAM role with these policies:

### Trust Policy

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

### Permission Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl", "s3:GetObject"],
      "Resource": "arn:aws:s3:::ingtec-ai-training-files/*"
    }
  ]
}
```

## Testing

Test your function with this sample event:

```json
{
  "httpMethod": "POST",
  "body": "{\"fileName\":\"test.pdf\",\"fileType\":\"application/pdf\",\"fileSize\":1024000,\"userEmail\":\"test@iespecialidades.com\",\"gptId\":\"test-gpt-123\"}"
}
```

## Update Function

To update the function code:

```bash
# Create new package
npm run package

# Update function
aws lambda update-function-code \
  --function-name ingtec-presigned-url-generator \
  --zip-file fileb://function.zip
```
