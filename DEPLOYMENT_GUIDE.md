# Kreando Agente Web - Deployment Guide

Complete guide for deploying the Kreando Agente Web application to AWS using Pulumi.

## Overview

This deployment creates:
- **S3 Bucket**: Hosts your React application
- **CloudFront CDN**: Distributes content globally with HTTPS
- **Origin Access Identity**: Secures S3 access through CloudFront only

## Prerequisites

### Required Software

1. **Node.js** (v14+)
   ```bash
   node --version  # Should be v14 or higher
   ```

2. **Pulumi CLI**
   ```bash
   # Install Pulumi
   curl -fsSL https://get.pulumi.com | sh
   
   # Verify installation
   pulumi version
   ```

3. **AWS CLI**
   ```bash
   # Install AWS CLI
   # macOS: brew install awscli
   # Linux: pip install awscli
   # Windows: https://aws.amazon.com/cli/
   
   # Verify installation
   aws --version
   ```

### AWS Account Setup

1. Create an AWS account or use existing one
2. Create IAM user with programmatic access
3. Attach policy: `AdministratorAccess` (or more restrictive for production)
4. Configure AWS credentials:
   ```bash
   aws configure
   # Enter: Access Key ID
   # Enter: Secret Access Key
   # Enter: Default region (us-east-2)
   # Enter: Default output format (json)
   ```

## Deployment Steps

### Step 1: Prepare the Application

```bash
# Navigate to project root
cd reg-vectia-workflow-web-b2b

# Install dependencies
npm install

# Build the React application
npm run build

# Verify dist folder was created
ls -la dist/
```

### Step 2: Deploy Infrastructure

```bash
# Navigate to infrastructure folder
cd infra

# Option A: Automated (Recommended)
bash deploy.sh

# Option B: Manual
npm install
npm run build
npm run preview  # Review changes
npm run up       # Deploy
```

The script will:
- ✅ Check prerequisites
- ✅ Install dependencies
- ✅ Build TypeScript
- ✅ Preview infrastructure changes
- ✅ Ask for confirmation
- ✅ Deploy to AWS

### Step 3: Upload Application

```bash
# From infra folder
bash upload-app.sh

# Or manually
aws s3 sync ../dist/ s3://$(pulumi stack output bucketName)/ --delete
```

### Step 4: Access Your Application

```bash
# Get CloudFront domain
pulumi stack output distributionDomainName

# Open in browser
# https://d1234abcd.cloudfront.net
```

## Post-Deployment

### Verify Deployment

```bash
# Check S3 bucket
aws s3 ls s3://$(pulumi stack output bucketName)/

# Check CloudFront distribution
aws cloudfront get-distribution --id $(pulumi stack output distributionId)
```

### Monitor Performance

```bash
# View CloudFront metrics
aws cloudfront get-distribution-statistics --id $(pulumi stack output distributionId)
```

### Update Application

After making code changes:

```bash
# From project root
npm run build

# From infra folder
bash upload-app.sh
```

## Troubleshooting

### Issue: "AWS credentials not configured"

```bash
# Solution: Configure AWS credentials
aws configure

# Or use environment variables
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_REGION=us-east-2
```

### Issue: "Pulumi not found"

```bash
# Solution: Install Pulumi
curl -fsSL https://get.pulumi.com | sh

# Add to PATH if needed
export PATH=$PATH:$HOME/.pulumi/bin
```

### Issue: "App not updating after upload"

```bash
# Solution: Invalidate CloudFront cache
DIST_ID=$(cd infra && pulumi stack output distributionId)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

### Issue: "Permission denied" on scripts

```bash
# Solution: Make scripts executable
chmod +x infra/deploy.sh
chmod +x infra/upload-app.sh
```

### Issue: "Stack already exists"

```bash
# Solution: Select existing stack
cd infra
pulumi stack select dev
```

## Advanced Configuration

### Custom Domain (Optional)

To add a custom domain:

1. Register domain in Route53 or external registrar
2. Create ACM certificate for your domain
3. Update CloudFront distribution with certificate
4. Create Route53 alias record

```bash
# Example with Route53
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://change-batch.json
```

### Environment-Specific Stacks

```bash
# Create production stack
pulumi stack init prod

# Deploy to production
pulumi up --stack prod

# Switch between stacks
pulumi stack select dev
pulumi stack select prod
```

### Cost Optimization

1. **Enable S3 versioning** (already enabled)
2. **Set CloudFront cache TTL** (already optimized)
3. **Use CloudFront compression** (enabled by default)
4. **Monitor costs**:
   ```bash
   # Estimate monthly costs
   # S3: ~$0.023/GB
   # CloudFront: ~$0.085/GB (first 10TB)
   ```

## Cleanup

### Destroy Infrastructure (WARNING: Irreversible)

```bash
cd infra

# Preview what will be deleted
pulumi preview --destroy

# Delete infrastructure
npm run destroy

# Or manually
pulumi destroy --yes
```

This will:
- ❌ Delete S3 bucket (and all files)
- ❌ Delete CloudFront distribution
- ❌ Delete Origin Access Identity

## Useful Commands

```bash
# View all outputs
pulumi stack output

# View specific output
pulumi stack output distributionDomainName

# Export stack configuration
pulumi stack export > stack-backup.json

# Import stack configuration
pulumi stack import < stack-backup.json

# View stack history
pulumi history

# Refresh state
pulumi refresh

# List all resources
pulumi stack export | jq '.deployment.resources'
```

## Security Best Practices

1. ✅ S3 bucket is private (only CloudFront can access)
2. ✅ All public access is blocked
3. ✅ HTTPS is enforced
4. ✅ CloudFront uses OAI for secure S3 access
5. ⚠️ Consider adding:
   - WAF (Web Application Firewall)
   - Custom domain with ACM certificate
   - Access logging
   - Versioning (already enabled)

## Support

For issues or questions:

1. Check Pulumi documentation: https://www.pulumi.com/docs/
2. Check AWS documentation: https://docs.aws.amazon.com/
3. Review infrastructure code: `infra/index.ts`
4. Check logs: `pulumi logs`

## Next Steps

1. ✅ Deploy infrastructure
2. ✅ Upload application
3. ⏭️ Add custom domain (optional)
4. ⏭️ Set up CI/CD pipeline
5. ⏭️ Configure monitoring and alerts
6. ⏭️ Set up backup strategy
