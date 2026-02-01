# Kreando Agente Web Infrastructure

This folder contains the Pulumi Infrastructure as Code (IaC) for deploying the Kreando Agente Web application to AWS.

## Architecture

The infrastructure creates:

- **S3 Bucket**: Stores the built React application files
- **CloudFront Distribution**: CDN for fast global content delivery
- **Origin Access Identity (OAI)**: Secure access from CloudFront to S3
- **Bucket Policy**: Restricts S3 access to CloudFront only

## Prerequisites

1. **Pulumi CLI**: [Install Pulumi](https://www.pulumi.com/docs/get-started/install/)
2. **Node.js**: Version 14 or higher
3. **AWS Account**: With appropriate credentials configured
4. **AWS CLI**: Configured with credentials

```bash
# Install Pulumi
curl -fsSL https://get.pulumi.com | sh

# Configure AWS credentials
aws configure
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Initialize Pulumi stack (if not already done):
```bash
pulumi stack init dev
```

## Deployment

### Option 1: Using the deploy script (Recommended)

```bash
bash deploy.sh
```

This script will:
- Check prerequisites
- Install dependencies
- Build TypeScript
- Preview changes
- Deploy infrastructure (with confirmation)

### Option 2: Manual deployment

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Preview changes
npm run preview

# Deploy
npm run up
```

## After Deployment

Once deployed, you need to upload your built React app to S3:

```bash
# From the project root (reg-vectia-workflow-web-b2b)
npm run build

# Get the bucket name from Pulumi outputs
BUCKET_NAME=$(cd infra && pulumi stack output bucketName)

# Upload files to S3
aws s3 sync dist/ s3://$BUCKET_NAME/ --delete

# Invalidate CloudFront cache
DISTRIBUTION_ID=$(cd infra && pulumi stack output distributionId)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

## Useful Commands

```bash
# View stack outputs
pulumi stack output

# View specific output
pulumi stack output distributionDomainName

# Destroy infrastructure (WARNING: This will delete everything)
npm run destroy

# List all stacks
pulumi stack ls

# Switch to different stack
pulumi stack select <stack-name>
```

## Environment Variables

The infrastructure uses the AWS region from Pulumi config:

```bash
# Set region (default: us-east-2)
pulumi config set aws:region us-east-2
```

## Troubleshooting

### AWS Credentials Error
```bash
# Configure AWS credentials
aws configure

# Or use environment variables
export AWS_ACCESS_KEY_ID=<your-key>
export AWS_SECRET_ACCESS_KEY=<your-secret>
export AWS_REGION=us-east-2
```

### Pulumi State Issues
```bash
# Refresh state
pulumi refresh

# View current state
pulumi stack export
```

### CloudFront Not Serving Latest Files
```bash
# Invalidate CloudFront cache
DISTRIBUTION_ID=$(pulumi stack output distributionId)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

## Cost Estimation

- **S3 Storage**: ~$0.023 per GB/month
- **CloudFront**: ~$0.085 per GB (first 10TB/month)
- **Data Transfer**: Varies by region

For a typical small application, expect ~$1-5/month.

## Security Notes

- S3 bucket is private and only accessible through CloudFront
- CloudFront uses HTTPS by default
- All public access to S3 is blocked
- Consider adding a custom domain with ACM certificate for production

## Next Steps

1. Deploy infrastructure: `bash deploy.sh`
2. Build React app: `npm run build` (from project root)
3. Upload to S3: `aws s3 sync dist/ s3://<bucket-name>/ --delete`
4. Access via CloudFront domain name
5. (Optional) Add custom domain with Route53 and ACM certificate
