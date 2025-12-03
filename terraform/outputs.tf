output "s3_bucket_name" {
  value = aws_s3_bucket.portfolio_bucket.id
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.s3_distribution.id
}

output "website_url" {
  value = "https://${aws_cloudfront_distribution.s3_distribution.domain_name}"
}

output "github_actions_role_arn" {
  value = aws_iam_role.github_actions_role.arn
}
