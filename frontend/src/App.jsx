import { useCallback, useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documentService';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setDocuments(await listDocuments());
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>

      <section>
        <h2>Enviar documento</h2>
        <UploadComponent onUploadSuccess={loadDocuments} />
      </section>

      <section>
        <h2>Documentos</h2>
        <DocumentList documents={documents} isLoading={isLoading} errorMessage={errorMessage} />
      </section>
    </main>
  );
}
