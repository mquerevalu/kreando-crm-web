#!/bin/bash

set -e

echo "📤 Uploading Kreando Agente Web to S3..."

# Check if Pulumi is installed
if ! command -v pulumi &> /dev/null; then
    echo "❌ Pulumi is not installed."
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed."
    exit 1
fi

# Get bucket name and distribution ID from Pulumi
BUCKET_NAME=$(pulumi stack output bucketName 2>/dev/null)
DISTRIBUTION_ID=$(pulumi stack output distributionId 2>/dev/null)

if [ -z "$BUCKET_NAME" ]; then
    echo "❌ Could not get bucket name from Pulumi. Make sure infrastructure is deployed."
    exit 1
fi

echo "📦 Bucket: $BUCKET_NAME"
echo "🌐 Distribution ID: $DISTRIBUTION_ID"

# Check if dist folder exists
if [ ! -d "../dist" ]; then
    echo "❌ dist folder not found. Building React app first..."
    cd ..
    npm run build
    cd infra
fi

# Upload files to S3
echo "⬆️  Uploading files to S3..."
aws s3 sync ../dist/ s3://$BUCKET_NAME/ --delete --cache-control "public, max-age=3600"

# Invalidate CloudFront cache
if [ ! -z "$DISTRIBUTION_ID" ]; then
    echo "🔄 Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
fi

echo ""
echo "✅ Upload complete!"
echo ""
echo "🌐 Your app is available at:"
echo "   https://$(pulumi stack output distributionDomainName)"
