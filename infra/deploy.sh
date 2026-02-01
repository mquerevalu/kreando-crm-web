#!/bin/bash

set -e

echo "🚀 Deploying Kreando Agente Web Infrastructure..."

# Check if Pulumi is installed
if ! command -v pulumi &> /dev/null; then
    echo "❌ Pulumi is not installed. Please install it first:"
    echo "   https://www.pulumi.com/docs/get-started/install/"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials are not configured. Please configure them first:"
    echo "   aws configure"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Preview changes
echo "👀 Previewing infrastructure changes..."
pulumi preview

# Ask for confirmation
read -p "Do you want to proceed with deployment? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⬆️  Deploying infrastructure..."
    pulumi up --yes
    
    # Get outputs
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📋 Outputs:"
    pulumi stack output bucketName
    pulumi stack output distributionDomainName
    
    echo ""
    echo "🌐 Your web app will be available at:"
    echo "   https://$(pulumi stack output distributionDomainName)"
else
    echo "❌ Deployment cancelled."
    exit 1
fi
