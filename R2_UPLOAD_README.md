# Cloudflare R2 File Upload API

This Next.js application provides API endpoints for uploading files to Cloudflare R2 storage with two different approaches:

1. **Server-side Upload**: Upload files to your server, server handles presigned URL internally
2. **Direct Upload**: Client gets presigned URL and uploads directly to R2

## Upload Methods Comparison

### Server-side Upload (`/api/upload`)
**When to use:**
- Simple client-side implementation
- Need to validate/process files before upload
- Want to add authentication/authorization
- Prefer centralized upload logic

**How it works:**
1. Client uploads file to your server
2. Server generates presigned URL internally
3. Server uploads file to R2 using presigned URL
4. Server returns public URL to client

### Direct Upload (`/api/generate-upload-url`)
**When to use:**
- Large files that would strain your server
- Want maximum upload performance
- Need to minimize server bandwidth usage
- Client can handle more complex upload logic

**How it works:**
1. Client requests presigned URL from server
2. Server generates and returns presigned URL
3. Client uploads file directly to R2
4. File never touches your server

## Benefits of Presigned URLs

- **Security**: Temporary URLs with expiration times
- **Scalability**: Handle large files without server constraints
- **Performance**: Faster uploads and less bandwidth usage
- **Cost Effective**: Reduced server load and bandwidth costs

## Installation

All dependencies have been installed. The following packages were added:
- `@aws-sdk/client-s3` - AWS SDK for S3 (compatible with R2)
- `@aws-sdk/s3-request-presigner` - For generating presigned URLs
- `multer` - For handling multipart file uploads (server-side upload)
- `dotenv` - For environment variable management
- `cors` - For handling cross-origin requests

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
AWS_ACCESS_KEY_ID=your-r2-access-key
AWS_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET=your-bucket-name
R2_PUBLIC_URL=https://your-r2-domain.com
```

## API Endpoints

### 1. Health Check
- **GET** `/api/health`
- Returns server status and environment configuration

### 2. Server-side Upload
- **POST** `/api/upload`
- Upload files to server, server handles presigned URL internally
- **Body**: `FormData` with `file` field
- **Response**: 
  ```json
  {
    "success": true,
    "video_url": "https://your-r2-domain.com/filename.ext",
    "thumbnail_url": "",
    "duration": "",
    "message": "File uploaded successfully",
    "filename": "example.jpg",
    "size": 2048576,
    "type": "image/jpeg"
  }
  ```

### 3. Generate Upload URL
- **POST** `/api/generate-upload-url`
- Generate presigned URL for direct client-side upload
- **Body**: 
  ```json
  {
    "filename": "example.jpg",
    "contentType": "image/jpeg"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "presignedUrl": "https://...",
    "publicUrl": "https://your-r2-domain.com/example.jpg",
    "filename": "example.jpg",
    "message": "Presigned URL generated successfully"
  }
  ```

### 4. Generate Download URL
- **POST** `/api/generate-download-url`
- Generate presigned URL for secure downloads
- **Body**: 
  ```json
  {
    "filename": "example.jpg"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "presignedUrl": "https://...",
    "filename": "example.jpg",
    "message": "Download URL generated successfully"
  }
  ```

## Usage Examples

### JavaScript/Fetch API

#### Server-side Upload:
```javascript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
if (result.success) {
  console.log('File uploaded successfully!');
  console.log('Public URL:', result.video_url);
  console.log('File info:', result.filename, result.size, result.type);
}
```

#### Direct Upload (Presigned URL):
```javascript
// Step 1: Get presigned URL
const urlResponse = await fetch('/api/generate-upload-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filename: file.name,
    contentType: file.type
  })
});

const { presignedUrl, publicUrl } = await urlResponse.json();

// Step 2: Upload directly to R2
const uploadResponse = await fetch(presignedUrl, {
  method: 'PUT',
  headers: { 'Content-Type': file.type },
  body: file
});

if (uploadResponse.ok) {
  console.log('File uploaded successfully!');
  console.log('Public URL:', publicUrl);
}
```

### cURL Examples

#### Server-side Upload:
```bash
curl -X POST \
  -F "file=@/path/to/test.jpg" \
  http://localhost:3000/api/upload
```

#### Generate Upload URL:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.jpg","contentType":"image/jpeg"}' \
  http://localhost:3000/api/generate-upload-url
```

#### Upload File using Presigned URL:
```bash
# First get the presigned URL (from above command)
# Then upload the file:
curl -X PUT \
  -H "Content-Type: image/jpeg" \
  --data-binary @/path/to/test.jpg \
  "YOUR_PRESIGNED_URL_HERE"
```

## Test Interface

Visit `http://localhost:3000/upload` to access the built-in upload test interface.

## Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The server will be available at `http://localhost:3000`

3. Test the health endpoint: `http://localhost:3000/api/health`

## CORS Configuration

The API endpoints include CORS headers to allow cross-origin requests. You can modify the CORS configuration in each route file as needed.

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Security Notes

- Presigned URLs expire after 1 hour
- Environment variables should be kept secure
- Consider implementing authentication for production use
- File size limits can be configured in the upload endpoints 