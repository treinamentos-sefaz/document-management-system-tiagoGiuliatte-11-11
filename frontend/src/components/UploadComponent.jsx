import { useState } from 'react';
import { uploadDocument } from '../services/documentService';

export default function UploadComponent({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile) {
      setFeedback({ type: 'error', text: 'Selecione um arquivo antes de enviar.' });
      return;
    }

    const form = event.currentTarget;
    setIsUploading(true);
    setFeedback({ type: '', text: '' });
    try {
      const metadata = await uploadDocument(selectedFile);
      setFeedback({ type: 'success', text: `Arquivo "${metadata.originalName}" enviado com sucesso.` });
      setSelectedFile(null);
      form.reset();
      onUploadSuccess?.(metadata);
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        name="file"
        onChange={(event) => setSelectedFile(event.target.files[0] ?? null)}
        disabled={isUploading}
      />
      <button type="submit" disabled={isUploading || !selectedFile}>
        {isUploading ? 'Enviando...' : 'Enviar'}
      </button>
      {feedback.text && (
        <p role={feedback.type === 'error' ? 'alert' : 'status'} style={{ color: feedback.type === 'error' ? 'crimson' : 'green' }}>
          {feedback.text}
        </p>
      )}
    </form>
  );
}
