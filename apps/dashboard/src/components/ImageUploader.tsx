import { useRef, useState } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadImage } from '../lib/apiClient';

interface ImageUploaderProps {
  /** Called with the public CDN URL once the upload succeeds */
  onUploaded: (url: string) => void;
  disabled?: boolean;
}

/**
 * A button that opens a file picker, uploads the chosen image to Cloudflare R2
 * via POST /vendor/images/upload, and calls onUploaded with the resulting URL.
 */
export default function ImageUploader({ onUploaded, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be re-selected if needed
    e.target.value = '';

    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onUploaded(url);
    } catch {
      setError('Upload failed — check your connection and try again');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Box>
      {/* Hidden native file input — triggered by the button below */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button
        variant="outlined"
        size="small"
        startIcon={uploading ? <CircularProgress size={14} /> : <CloudUploadIcon />}
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Uploading…' : 'Upload Image'}
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
