# Deployment Checklist

Use this checklist to ensure everything is ready for deployment.

## Pre-Deployment

### Prerequisites
- [ ] Node.js v14+ installed (`node --version`)
- [ ] Pulumi CLI installed (`pulumi version`)
- [ ] AWS CLI installed (`aws --version`)
- [ ] AWS credentials configured (`aws sts get-caller-identity`)
- [ ] AWS region set to us-east-2

### Code Preparation
- [ ] All code changes committed to git
- [ ] No uncommitted changes in working directory
- [ ] Environment variables configured in `.env`
- [ ] Cognito credentials verified in `.env.local`

### Infrastructure Files
- [ ] `infra/index.ts` exists and compiles
- [ ] `infra/package.json` has correct dependencies
- [ ] `infra/tsconfig.json` is configured
- [ ] `infra/Pulumi.yaml` is configured
- [ ] `infra/deploy.sh` is executable
- [ ] `infra/upload-app.sh` is executable

## Deployment

### Step 1: Build Infrastructure
- [ ] Navigate to `infra` folder
- [ ] Run `npm install` (if first time)
- [ ] Run `npm run build` (verify no TypeScript errors)
- [ ] Run `npm run preview` (review planned changes)
- [ ] Run `npm run up` or `bash deploy.sh`
- [ ] Verify outputs: `pulumi stack output`

### Step 2: Build Application
- [ ] Navigate to project root
- [ ] Run `npm install` (if needed)
- [ ] Run `npm run build`
- [ ] Verify `dist/` folder created
- [ ] Verify `dist/index.html` exists

### Step 3: Upload Application
- [ ] Navigate to `infra` folder
- [ ] Run `bash upload-app.sh`
- [ ] Verify S3 upload completed
- [ ] Verify CloudFront cache invalidated

### Step 4: Verify Deployment
- [ ] Get CloudFront domain: `pulumi stack output distributionDomainName`
- [ ] Open domain in browser
- [ ] Verify app loads correctly
- [ ] Test navigation and functionality
- [ ] Check browser console for errors
- [ ] Verify HTTPS is working

## Post-Deployment

### Verification
- [ ] App is accessible via CloudFront domain
- [ ] All pages load correctly
- [ ] API calls work (check network tab)
- [ ] WebSocket connections work (if applicable)
- [ ] No console errors
- [ ] Responsive design works on mobile

### Monitoring
- [ ] Check CloudFront metrics
- [ ] Monitor S3 bucket size
- [ ] Review CloudFront cache hit ratio
- [ ] Check for any errors in CloudFront logs

### Documentation
- [ ] Document CloudFront domain
- [ ] Document S3 bucket name
- [ ] Document deployment date and time
- [ ] Update team documentation
- [ ] Share access information with team

## Troubleshooting

### If Infrastructure Deployment Fails
- [ ] Check AWS credentials: `aws sts get-caller-identity`
- [ ] Check AWS permissions (need S3, CloudFront, IAM)
- [ ] Review error message in Pulumi output
- [ ] Check Pulumi logs: `pulumi logs`
- [ ] Try destroying and redeploying: `npm run destroy && npm run up`

### If App Upload Fails
- [ ] Verify S3 bucket exists: `aws s3 ls`
- [ ] Check S3 permissions
- [ ] Verify dist folder exists and has files
- [ ] Try manual upload: `aws s3 sync dist/ s3://bucket-name/`

### If App Doesn't Load
- [ ] Check CloudFront distribution status
- [ ] Verify S3 bucket has files: `aws s3 ls s3://bucket-name/`
- [ ] Check browser cache (hard refresh: Cmd+Shift+R)
- [ ] Invalidate CloudFront cache: `aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"`
- [ ] Check CloudFront error logs

## Rollback

If something goes wrong:

### Option 1: Revert Code
```bash
git revert <commit-hash>
npm run build
cd infra
bash upload-app.sh
```

### Option 2: Destroy and Redeploy
```bash
cd infra
npm run destroy
npm run up
bash upload-app.sh
```

### Option 3: Manual Cleanup
```bash
# Delete S3 objects
aws s3 rm s3://bucket-name/ --recursive

# Delete CloudFront distribution
aws cloudfront delete-distribution --id <ID>

# Delete Pulumi stack
pulumi stack rm
```

## Performance Optimization

After deployment, consider:

- [ ] Enable CloudFront compression
- [ ] Optimize cache TTL values
- [ ] Enable S3 access logging
- [ ] Set up CloudWatch alarms
- [ ] Configure WAF rules
- [ ] Add custom domain with ACM certificate

## Security Review

- [ ] S3 bucket is private ✓
- [ ] Public access is blocked ✓
- [ ] HTTPS is enforced ✓
- [ ] OAI is configured ✓
- [ ] Bucket policy is correct ✓
- [ ] Consider adding WAF
- [ ] Consider adding access logging
- [ ] Review IAM permissions

## Final Sign-Off

- [ ] All checks passed
- [ ] App is live and working
- [ ] Team notified
- [ ] Documentation updated
- [ ] Monitoring configured
- [ ] Backup created

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Notes**: _______________
