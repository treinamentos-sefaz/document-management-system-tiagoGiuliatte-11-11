import { useState } from 'react';
import { downloadDocument } from '../services/documentService';

// Dispara o download no navegador a partir de um Blob, sem expor a URL do blob.
function saveBlobAsFile(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export default function DownloadButton({ documentId, fileName }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleClick() {
    setIsDownloading(true);
    setErrorMessage('');
    try {
      const blob = await downloadDocument(documentId);
      saveBlobAsFile(blob, fileName);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <span>
      <button type="button" onClick={handleClick} disabled={isDownloading}>
        {isDownloading ? 'Baixando...' : 'Baixar'}
      </button>
      {errorMessage && <span role="alert" style={{ color: 'crimson', marginLeft: '0.5rem' }}>{errorMessage}</span>}
    </span>
  );
}
