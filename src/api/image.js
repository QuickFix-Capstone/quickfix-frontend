const S3_PUBLIC_BASE_URL =
  "https://quickfix-app-files.s3.us-east-2.amazonaws.com";

export function buildImageUrl(imageKey) {
  if (!imageKey) return null;
  return `${S3_PUBLIC_BASE_URL}/${imageKey}`;
}
