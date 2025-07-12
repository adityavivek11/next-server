'use client';
import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
    setUploadStatus('');
  };



  const uploadViaServer = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);
    setUploadStatus('');

    try {
      setUploadStatus('Uploading file to server...');
      setUploadProgress(25);

      // Upload to server endpoint (server handles presigned URL internally)
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(75);
      setUploadStatus('Server processing and uploading to R2...');

      const data = await response.json();

      if (data.success) {
        setUploadProgress(100);
        setUploadStatus('Upload completed successfully!');
        setResult({
          success: true,
          video_url: data.video_url,
          message: 'Upload successful via server!',
          filename: data.filename,
          size: data.size,
          type: data.type
        });
        setFile(null);
        document.getElementById('fileInput').value = '';
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const uploadViaPresignedUrl = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);
    setUploadStatus('');

    try {
      // Step 1: Get presigned URL
      setUploadStatus('Generating presigned URL...');
      const urlResponse = await fetch('/api/generate-upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type
        })
      });

      const urlData = await urlResponse.json();
      if (!urlData.success) {
        throw new Error(urlData.error);
      }

      setUploadProgress(25);
      setUploadStatus('Uploading file directly to R2...');

      // Step 2: Upload directly to R2 using presigned URL
      const uploadResponse = await fetch(urlData.presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file
      });

      if (uploadResponse.ok) {
        setUploadProgress(100);
        setUploadStatus('Upload completed successfully!');
        setResult({
          success: true,
          video_url: urlData.publicUrl,
          message: 'Upload successful via presigned URL!'
        });
        setFile(null);
        document.getElementById('fileInput').value = '';
      } else {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }
    } catch (err) {
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Upload Files to Cloudflare R2</h1>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Two upload methods available:</strong>
        </p>
        <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
          <li><strong>Server Upload:</strong> Upload to your server, server handles presigned URL internally</li>
          <li><strong>Direct Upload:</strong> Client gets presigned URL and uploads directly to R2</li>
        </ul>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Select File:</label>
          <input
            id="fileInput"
            type="file"
            onChange={handleFileSelect}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={uploading}
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={uploadViaServer}
            disabled={!file || uploading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {uploading ? 'Uploading...' : 'Upload via Server'}
          </button>
          
          <button
            onClick={uploadViaPresignedUrl}
            disabled={!file || uploading}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
          >
            {uploading ? 'Uploading...' : 'Upload Direct (Presigned)'}
          </button>
        </div>

        {uploadProgress > 0 && (
          <div className="space-y-2">
            {uploadStatus && (
              <p className="text-sm text-blue-600 font-medium">{uploadStatus}</p>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            <p className="font-semibold">{result.message}</p>
            {result.video_url && (
              <p className="mt-2">
                <strong>URL:</strong>{' '}
                <a 
                  href={result.video_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {result.video_url}
                </a>
              </p>
            )}
            {result.filename && (
              <p className="mt-1">
                <strong>Filename:</strong> {result.filename}
              </p>
            )}
            {result.size && (
              <p className="mt-1">
                <strong>Size:</strong> {(result.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
            {result.type && (
              <p className="mt-1">
                <strong>Type:</strong> {result.type}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
        <div className="space-y-2 text-sm">
          <p><strong>POST /api/upload</strong> - Upload file via server (server handles presigned URL internally)</p>
          <p><strong>POST /api/generate-upload-url</strong> - Generate presigned URL for direct upload</p>
          <p><strong>POST /api/generate-download-url</strong> - Generate presigned URL for download</p>
          <p><strong>GET /api/health</strong> - Health check</p>
        </div>
      </div>
    </div>
  );
} 