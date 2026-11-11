const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const config = require('../config');
const documentRepository = require('../repositories/documentRepository');
const { HttpError } = require('../errors/httpError');
const STORED_FILE_NAME = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}(?:\.[a-z0-9]{1,10})?$/;

// Metadados expostos pela API; o nome físico do arquivo é interno.
function toPublicMetadata(record) {
  return {
    id: record.id,
    originalName: record.originalName,
    size: record.size,
    uploadedAt: record.uploadedAt,
    owner: record.owner,
  };
}

function registerDocument({ storedFileName, originalName, size, owner }) {
  const record = documentRepository.save({
    id: randomUUID(),
    originalName,
    size,
    uploadedAt: new Date().toISOString(),
    owner,
    storedFileName,
  });
  return toPublicMetadata(record);
}

function listDocuments(pagination) {
  const records = documentRepository.findAll();
  const documents = pagination
    ? records.slice(pagination.offset, pagination.offset + pagination.limit)
    : records;
  return {
    documents: documents.map(toPublicMetadata),
    total: records.length,
  };
}

async function getDocumentFile(id) {
  const record = documentRepository.findById(id);
  if (!record) {
    throw new HttpError(404, 'Documento não encontrado.');
  }

  if (!STORED_FILE_NAME.test(record.storedFileName)) {
    throw new HttpError(500, 'Registro de arquivo inválido.');
  }

  const storageDir = path.resolve(config.storageDir);
  const filePath = path.resolve(storageDir, record.storedFileName);
  if (!filePath.startsWith(`${storageDir}${path.sep}`)) {
    throw new HttpError(500, 'Registro de arquivo inválido.');
  }
  try {
    await fs.stat(filePath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new HttpError(404, 'Arquivo do documento não encontrado no armazenamento.');
    }
    throw err;
  }

  return { filePath, originalName: record.originalName };
}

module.exports = { registerDocument, listDocuments, getDocumentFile };
