provider "aws" {
  region = var.aws_region
}

terraform {
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "3.6.2"
    }
  }
}

# 1. Create an S3 bucket to store your static website files
resource "aws_s3_bucket" "portfolio_bucket" {
  bucket = "portfolio-website-${random_pet.bucket_suffix.id}"
}

# Block all public access as CloudFront will be the only one accessing it
resource "aws_s3_bucket_public_access_block" "portfolio_bucket_pab" {
  bucket = aws_s3_bucket.portfolio_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "random_pet" "bucket_suffix" {
  length = 2
}

# 5. Create a CloudFront Origin Access Control (OAC)
# This allows CloudFront to securely access files in the S3 bucket.
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "OAC for portfolio website"
  description                       = "Origin Access Control for S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# 6. Grant the CloudFront distribution read access to the S3 bucket
resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.portfolio_bucket.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.portfolio_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.s3_distribution.arn
          }
        }
      }
    ]
  })
}

# 7. Create the CloudFront Distribution
resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = aws_s3_bucket.portfolio_bucket.bucket_regional_domain_name
    origin_id   = "S3-portfolio-origin"

    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-portfolio-origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

}

# 8. Create an IAM OIDC provider for GitHub Actions
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = ["6938fd4d9c6d15aaa29c34e00345e41b61b05ea2"] # Standard thumbprint for GitHub OIDC
}

# 9. Create an IAM role for the GitHub Actions workflow to assume
resource "aws_iam_role" "github_actions_role" {
  name = "github-actions-deploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        },
        Action = "sts:AssumeRoleWithWebIdentity",
        Condition = {
          StringLike = {
            # This condition restricts the role to only be assumable by workflows
            # from the 'janmaaarc/portfolio-website' repository.
            "token.actions.githubusercontent.com:sub" : "repo:janmaaarc/portfolio-website:*"
          }
        }
      }
    ]
  })
}

# 10. Attach the S3 and CloudFront permissions to the new role
resource "aws_iam_role_policy" "github_actions_policy" {
  role = aws_iam_role.github_actions_role.id
  policy = data.aws_iam_policy_document.github_actions_policy.json
}

# This data source defines the permissions for the IAM role
data "aws_iam_policy_document" "github_actions_policy" {
  statement {
    sid    = "AllowS3Sync"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:ListBucket",
      "s3:DeleteObject",
    ]
    resources = [
      aws_s3_bucket.portfolio_bucket.arn,
      "${aws_s3_bucket.portfolio_bucket.arn}/*",
    ]
  }

  statement {
    sid       = "AllowCloudFrontInvalidation"
    effect    = "Allow"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [aws_cloudfront_distribution.s3_distribution.arn]
  }
}
