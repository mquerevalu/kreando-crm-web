# Infrastructure Documentation Index

Complete guide to all infrastructure documentation and files.

## 📋 Start Here

**New to this infrastructure?** Start with one of these:

1. **[INFRASTRUCTURE_READY.md](./INFRASTRUCTURE_READY.md)** - Overview of what was created
2. **[infra/QUICKSTART.md](./infra/QUICKSTART.md)** - 5-minute setup guide
3. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment walkthrough

## 📚 Documentation Files

### Quick References
- **[infra/QUICKSTART.md](./infra/QUICKSTART.md)** - 5-minute setup (recommended for first-time users)
- **[infra/DEPLOYMENT_CHECKLIST.md](./infra/DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist

### Comprehensive Guides
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Full deployment walkthrough with troubleshooting
- **[infra/README.md](./infra/README.md)** - Complete infrastructure documentation
- **[infra/INFRASTRUCTURE_SUMMARY.md](./infra/INFRASTRUCTURE_SUMMARY.md)** - Technical architecture details

### Status
- **[INFRASTRUCTURE_READY.md](./INFRASTRUCTURE_READY.md)** - Current status and what was created

## 🔧 Infrastructure Files

### Core Infrastructure
- **[infra/index.ts](./infra/index.ts)** - Main Pulumi infrastructure code
  - S3 bucket creation
  - CloudFront distribution
  - Origin Access Identity
  - Bucket policy
  - Cache configuration

### Configuration
- **[infra/package.json](./infra/package.json)** - NPM dependencies and scripts
- **[infra/tsconfig.json](./infra/tsconfig.json)** - TypeScript configuration
- **[infra/Pulumi.yaml](./infra/Pulumi.yaml)** - Pulumi project configuration
- **[infra/.gitignore](./infra/.gitignore)** - Git exclusions

### Deployment Scripts
- **[infra/deploy.sh](./infra/deploy.sh)** - Automated infrastructure deployment
- **[infra/upload-app.sh](./infra/upload-app.sh)** - Automated app upload to S3

### Compiled Output
- **[infra/bin/index.js](./infra/bin/index.js)** - Compiled JavaScript
- **[infra/bin/index.d.ts](./infra/bin/index.d.ts)** - TypeScript definitions

## 🚀 Quick Commands

### First-Time Setup
```bash
# 1. Install prerequisites
curl -fsSL https://get.pulumi.com | sh
aws configure

# 2. Deploy infrastructure
cd infra
bash deploy.sh

# 3. Build and upload app
cd ..
npm run build
cd infra
bash upload-app.sh
```

### Regular Updates
```bash
# After code changes
npm run build
cd infra
bash upload-app.sh
```

### View Status
```bash
cd infra
pulumi stack output
```

## 📖 Reading Guide

### For Different Roles

**👨‍💻 Developers**
1. Read: [infra/QUICKSTART.md](./infra/QUICKSTART.md)
2. Read: [infra/README.md](./infra/README.md)
3. Reference: [infra/index.ts](./infra/index.ts)

**🏗️ DevOps/Infrastructure**
1. Read: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. Read: [infra/INFRASTRUCTURE_SUMMARY.md](./infra/INFRASTRUCTURE_SUMMARY.md)
3. Reference: [infra/index.ts](./infra/index.ts)

**📋 Project Managers**
1. Read: [INFRASTRUCTURE_READY.md](./INFRASTRUCTURE_READY.md)
2. Reference: [infra/DEPLOYMENT_CHECKLIST.md](./infra/DEPLOYMENT_CHECKLIST.md)

**🔍 Troubleshooters**
1. Read: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Troubleshooting section
2. Reference: [infra/README.md](./infra/README.md) - Troubleshooting section

## 🎯 Common Tasks

### Deploy Infrastructure
→ See: [infra/QUICKSTART.md](./infra/QUICKSTART.md) - Step 2

### Upload Application
→ See: [infra/QUICKSTART.md](./infra/QUICKSTART.md) - Step 3

### Update Application
→ See: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Update Application

### Add Custom Domain
→ See: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Advanced Configuration

### Troubleshoot Issues
→ See: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Troubleshooting

### Destroy Infrastructure
→ See: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Cleanup

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CloudFront CDN                        │
│              (HTTPS, Global Distribution)                │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ (OAI - Secure Access)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    S3 Bucket                             │
│         (Private, Versioning Enabled)                    │
│  - index.html (SPA entry point)                          │
│  - Static assets (JS, CSS, images)                       │
└─────────────────────────────────────────────────────────┘
```

## ✅ Verification Checklist

- [x] Infrastructure code created (index.ts)
- [x] TypeScript compiles without errors
- [x] Dependencies installed (package.json)
- [x] Configuration files created
- [x] Deployment scripts created and executable
- [x] Documentation complete
- [x] Ready for deployment

## 🔗 External Resources

- **Pulumi Documentation**: https://www.pulumi.com/docs/
- **AWS S3 Documentation**: https://docs.aws.amazon.com/s3/
- **AWS CloudFront Documentation**: https://docs.aws.amazon.com/cloudfront/
- **Pulumi AWS Provider**: https://www.pulumi.com/registry/packages/aws/

## 📞 Support

For issues or questions:

1. Check the relevant documentation file
2. Review troubleshooting sections
3. Check Pulumi logs: `pulumi logs`
4. Check AWS CloudTrail for API errors

## 📝 File Locations

All infrastructure files are in: `reg-vectia-workflow-web-b2b/infra/`

```
infra/
├── index.ts                    ← Infrastructure code
├── package.json                ← Dependencies
├── tsconfig.json               ← TypeScript config
├── Pulumi.yaml                 ← Pulumi config
├── deploy.sh                   ← Deploy script
├── upload-app.sh               ← Upload script
├── .gitignore                  ← Git exclusions
├── bin/                        ← Compiled output
├── node_modules/               ← Dependencies
├── README.md                   ← Full guide
├── QUICKSTART.md               ← Quick setup
├── INFRASTRUCTURE_SUMMARY.md   ← Technical details
└── DEPLOYMENT_CHECKLIST.md     ← Checklist
```

## 🎓 Learning Path

1. **Understand the Architecture**
   - Read: [INFRASTRUCTURE_READY.md](./INFRASTRUCTURE_READY.md)

2. **Quick Setup**
   - Read: [infra/QUICKSTART.md](./infra/QUICKSTART.md)
   - Follow: Step-by-step instructions

3. **Deep Dive**
   - Read: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
   - Read: [infra/README.md](./infra/README.md)

4. **Technical Details**
   - Read: [infra/INFRASTRUCTURE_SUMMARY.md](./infra/INFRASTRUCTURE_SUMMARY.md)
   - Review: [infra/index.ts](./infra/index.ts)

5. **Troubleshooting**
   - Reference: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Troubleshooting
   - Reference: [infra/README.md](./infra/README.md) - Troubleshooting

---

**Last Updated**: February 1, 2026
**Status**: ✅ Ready for Deployment
**Infrastructure Type**: Pulumi + AWS (S3 + CloudFront)
