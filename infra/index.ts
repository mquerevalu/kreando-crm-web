import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as path from "path";

const config = new pulumi.Config();
const awsRegion = config.get("aws:region") || "us-east-2";

// Create S3 bucket for hosting the web app
const bucket = new aws.s3.Bucket("kreando-agente-web", {
  acl: "private",
  versioning: {
    enabled: true,
  },
  tags: {
    Name: "kreando-agente-web",
    Environment: "production",
  },
});

// Block public access to bucket
const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  "kreando-agente-web-pab",
  {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }
);

// Create CloudFront Origin Access Identity
const oai = new aws.cloudfront.OriginAccessIdentity("kreando-agente-oai", {
  comment: "OAI for Kreando Agente Web",
});

// Create bucket policy to allow CloudFront access
const bucketPolicy = new aws.s3.BucketPolicy("kreando-agente-policy", {
  bucket: bucket.id,
  policy: pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "AWS": "${oai.iamArn}"
        },
        "Action": "s3:GetObject",
        "Resource": "${bucket.arn}/*"
      }
    ]
  }`,
});

// Create CloudFront distribution
const distribution = new aws.cloudfront.Distribution("kreando-agente-cdn", {
  enabled: true,
  isIpv6Enabled: true,
  comment: "CloudFront distribution for Kreando Agente Web",
  defaultRootObject: "index.html",
  origins: [
    {
      domainName: bucket.bucketRegionalDomainName,
      originId: "S3Origin",
      s3OriginConfig: {
        originAccessIdentity: oai.cloudfrontAccessIdentityPath,
      },
    },
  ],
  defaultCacheBehavior: {
    allowedMethods: ["GET", "HEAD", "OPTIONS"],
    cachedMethods: ["GET", "HEAD"],
    targetOriginId: "S3Origin",
    forwardedValues: {
      queryString: false,
      cookies: {
        forward: "none",
      },
    },
    viewerProtocolPolicy: "redirect-to-https",
    minTtl: 0,
    defaultTtl: 3600,
    maxTtl: 86400,
  },
  customErrorResponses: [
    {
      errorCode: 404,
      responseCode: 200,
      responsePagePath: "/index.html",
    },
    {
      errorCode: 403,
      responseCode: 200,
      responsePagePath: "/index.html",
    },
  ],
  restrictions: {
    geoRestriction: {
      restrictionType: "none",
    },
  },
  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
  },
  tags: {
    Name: "kreando-agente-cdn",
    Environment: "production",
  },
});

// Export outputs
export const bucketName = bucket.id;
export const bucketArn = bucket.arn;
export const distributionDomainName = distribution.domainName;
export const distributionId = distribution.id;
