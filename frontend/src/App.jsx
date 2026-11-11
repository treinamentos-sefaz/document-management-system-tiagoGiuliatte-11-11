import { useCallback, useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documentService';

const PAGE_SIZE = 25;

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await listDocuments({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
      setDocuments(result.documents);
      setTotalDocuments(result.total);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

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
        <DocumentList
          documents={documents}
          isLoading={isLoading}
          errorMessage={errorMessage}
          page={page}
          pageSize={PAGE_SIZE}
          total={totalDocuments}
          onPageChange={setPage}
        />
      </section>
    </main>
  );
}
