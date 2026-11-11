import DownloadButton from './DownloadButton';

// Formata o tamanho em bytes para uma unidade legível.
function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents, isLoading, errorMessage, page, pageSize, total, onPageChange }) {
  if (isLoading) {
    return <p>Carregando documentos...</p>;
  }
  if (errorMessage) {
    return <p role="alert" style={{ color: 'crimson' }}>{errorMessage}</p>;
  }
  if (documents.length === 0 && page === 0) {
    return <p>Nenhum documento enviado ainda.</p>;
  }

  return (
    <>
    <table>
      <thead>
        <tr>
          <th style={{ textAlign: 'left' }}>Nome</th>
          <th style={{ textAlign: 'left' }}>Tamanho</th>
          <th style={{ textAlign: 'left' }}>Enviado em</th>
          <th style={{ textAlign: 'left' }}>Dono</th>
          <th style={{ textAlign: 'left' }}>Ações</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((document) => (
          <tr key={document.id}>
            <td>{document.originalName}</td>
            <td>{formatFileSize(document.size)}</td>
            <td>{new Date(document.uploadedAt).toLocaleString('pt-BR')}</td>
            <td>{document.owner}</td>
            <td>
              <DownloadButton documentId={document.id} fileName={document.originalName} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <nav aria-label="Paginação de documentos">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 0 || isLoading}>
        Anterior
      </button>
      <span> Página {page + 1} de {Math.max(1, Math.ceil(total / pageSize))} </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={(page + 1) * pageSize >= total || isLoading}
      >
        Próxima
      </button>
    </nav>
    </>
  );
}
