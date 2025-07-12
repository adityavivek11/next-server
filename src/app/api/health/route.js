import { NextResponse } from 'next/server';

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'R2 uploader is running',
    timestamp: new Date().toISOString(),
    environment: {
      r2_endpoint: process.env.R2_ENDPOINT ? '✓ Set' : '✗ Missing',
      aws_access_key_id: process.env.AWS_ACCESS_KEY_ID ? '✓ Set' : '✗ Missing',
      aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ Missing',
      r2_bucket: process.env.R2_BUCKET ? '✓ Set' : '✗ Missing',
      r2_public_url: process.env.R2_PUBLIC_URL || 'Using default'
    }
  }, { headers: corsHeaders });
} 