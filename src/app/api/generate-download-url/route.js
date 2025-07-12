import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client for Cloudflare R2
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request) {
  try {
    const { filename } = await request.json();
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: filename,
    });

    // Generate presigned URL that expires in 1 hour
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({
      success: true,
      presignedUrl,
      filename,
      message: 'Download URL generated successfully'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate download URL'
    }, { status: 500, headers: corsHeaders });
  }
} 