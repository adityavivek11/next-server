import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Step 1: Generate presigned URL internally
    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: file.name,
      ContentType: file.type,
    });

    const presignedUrl = await getSignedUrl(s3, putCommand, { expiresIn: 3600 });

    // Step 2: Upload file to R2 using presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload to R2 failed with status: ${uploadResponse.status}`);
    }

    // Step 3: Return the public URL
    const baseUrl = process.env.R2_PUBLIC_URL || 'https://cdn.atulyaayurveda.shop';
    const encodedFilename = encodeURIComponent(file.name);
    const publicUrl = `${baseUrl}/${encodedFilename}`;

    return NextResponse.json({
      success: true,
      video_url: publicUrl,
      thumbnail_url: '',
      duration: '',
      message: 'File uploaded successfully',
      filename: file.name,
      size: file.size,
      type: file.type
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Upload failed'
    }, { status: 500, headers: corsHeaders });
  }
} 