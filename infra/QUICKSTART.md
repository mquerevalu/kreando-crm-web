# Quick Start Guide - Deploy Kreando Agente Web

## 5-Minute Setup

### Step 1: Prerequisites (One-time)

```bash
# Install Pulumi
curl -fsSL https://get.pulumi.com | sh

# Configure AWS credentials
aws configure
```

### Step 2: Deploy Infrastructure

```bash
cd reg-vectia-workflow-web-b2b/infra
bash deploy.sh
```

This will:
- ✅ Create S3 bucket
- ✅ Create CloudFront distribution
- ✅ Configure security and access

### Step 3: Build and Upload App

```bash
cd reg-vectia-workflow-web-b2b
npm run build
cd infra
bash upload-app.sh
```

### Step 4: Access Your App

The script will output your CloudFront domain. Open it in your browser:

```
https://d1234abcd.cloudfront.net
```

## Common Tasks

### Update App (After Code Changes)

```bash
cd reg-vectia-workflow-web-b2b
npm run build
cd infra
bash upload-app.sh
```

### View Infrastructure Status

```bash
cd reg-vectia-workflow-web-b2b/infra
pulumi stack output
```

### Destroy Infrastructure (WARNING)

```bash
cd reg-vectia-workflow-web-b2b/infra
npm run destroy
```

## Troubleshooting

**Q: "AWS credentials not configured"**
```bash
aws configure
# Enter your AWS Access Key ID and Secret Access Key
```

**Q: "Pulumi not found"**
```bash
curl -fsSL https://get.pulumi.com | sh
```

**Q: "App not updating after upload"**
```bash
# CloudFront cache needs to be invalidated
DISTRIBUTION_ID=$(cd infra && pulumi stack output distributionId)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

## Next Steps

- Add custom domain (see README.md)
- Configure SSL certificate with ACM
- Set up CI/CD pipeline for automatic deployments
