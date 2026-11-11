const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const config = require('../config');
const documentRepository = require('../repositories/documentRepository');
const { HttpError } = require('../errors/httpError');

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

function listDocuments() {
  return documentRepository.findAll().map(toPublicMetadata);
}

async function getDocumentFile(id) {
  const record = documentRepository.findById(id);
  if (!record) {
    throw new HttpError(404, 'Documento não encontrado.');
  }

  const filePath = path.join(config.storageDir, record.storedFileName);
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
