const path = require('path');
const { mkdir, unlink } = require('fs/promises');
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
    destination: (req, file, cb) => {
      mkdir(config.storageDir, { recursive: true }).then(
        () => cb(null, config.storageDir),
        cb,
      );
    },
    filename: (req, file, cb) => cb(null, buildStoredFileName(file.originalname)),
  }),
  limits: { fileSize: config.maxUploadBytes, files: 1, fields: 0, parts: 2 },
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
  uploadSingleFile(req, res, async (err) => {
    if (err) {
      return next(toUploadError(err));
    }
    if (!req.file) {
      return next(new HttpError(400, 'Envie um arquivo no campo "file" de multipart/form-data.'));
    }

    try {
      const metadata = documentService.registerDocument({
        storedFileName: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        owner: resolveOwner(req),
      });
      res.status(201).json(metadata);
    } catch (registrationError) {
      try {
        await unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Falha ao remover arquivo após erro no registro:', cleanupError);
      }
      next(registrationError);
    }
  });
}

function listDocuments(req, res) {
  const pagination = parsePagination(req);
  const result = documentService.listDocuments(pagination);
  if (pagination) {
    res.set('X-Total-Count', String(result.total));
  }
  res.json(result.documents);
}

function parsePagination(req) {
  const { limit, offset } = req.query;
  if (limit === undefined && offset === undefined) {
    return null;
  }

  const parsedLimit = limit === undefined ? 50 : Number(limit);
  const parsedOffset = offset === undefined ? 0 : Number(offset);
  if (!Number.isSafeInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100
      || !Number.isSafeInteger(parsedOffset) || parsedOffset < 0) {
    throw new HttpError(400, 'Parâmetros de paginação inválidos.');
  }
  return { limit: parsedLimit, offset: parsedOffset };
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
