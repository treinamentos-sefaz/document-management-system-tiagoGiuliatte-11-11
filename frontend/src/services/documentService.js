// Cliente HTTP do backend. Todas as rotas usam o prefixo /api, encaminhado
// pelo proxy do Vite e removido antes de chegar ao backend.
const API_BASE_URL = '/api';
const DEFAULT_ERROR_MESSAGE = 'Não foi possível concluir a operação. Tente novamente.';

async function readErrorMessage(response) {
  try {
    const body = await response.json();
    return body.error || DEFAULT_ERROR_MESSAGE;
  } catch {
    return DEFAULT_ERROR_MESSAGE;
  }
}

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', { method: 'POST', body: formData });
  return response.json();
}

export async function listDocuments() {
  const response = await request('/documents');
  return response.json();
}

export async function downloadDocument(documentId) {
  const response = await request(`/documents/${encodeURIComponent(documentId)}/download`);
  return response.blob();
}
