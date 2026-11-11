const path = require('path');
const { randomUUID } = require('crypto');
const multer = require('multer');
const config = require('../config');
const documentService = require('../services/documentService');
const { HttpError } = require('../errors/httpError');

const DEFAULT_OWNER = 'anonymous';
const SAFE_EXTENSION = /^\.[A-Za-z0-9]{1,10}$/;

// Nome físico único (UUID) para evitar colisões; a extensão só é mantida se for segura.
function buildStoredFileName(originalName) {
  const extension = path.extname(originalName).toLowerCase();
  const safeExtension = SAFE_EXTENSION.test(extension) ? extension : '';
  return `${randomUUID()}${safeExtension}`;
}

const uploadSingleFile = multer({
  storage: multer.diskStorage({
    destination: config.storageDir,
    filename: (req, file, cb) => cb(null, buildStoredFileName(file.originalname)),
  }),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
}).single('file');

function toUploadError(err) {
  if (!(err instanceof multer.MulterError)) {
    return err;
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new HttpError(413, 'Arquivo excede o tamanho máximo permitido.');
  }
  return new HttpError(400, 'Requisição de upload inválida.');
}

function resolveOwner(req) {
  return req.get('X-Owner-Id')?.trim() || DEFAULT_OWNER;
}

function uploadDocument(req, res, next) {
  uploadSingleFile(req, res, (err) => {
    if (err) {
      return next(toUploadError(err));
    }
    if (!req.file) {
      return next(new HttpError(400, 'Envie um arquivo no campo "file" de multipart/form-data.'));
    }

    const metadata = documentService.registerDocument({
      storedFileName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      owner: resolveOwner(req),
    });
    res.status(201).json(metadata);
  });
}

function listDocuments(req, res) {
  res.json(documentService.listDocuments());
}

async function downloadDocument(req, res, next) {
  try {
    const { filePath, originalName } = await documentService.getDocumentFile(req.params.id);
    res.download(filePath, originalName, (err) => {
      if (err && !res.headersSent) {
        next(err);
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadDocument, listDocuments, downloadDocument };
