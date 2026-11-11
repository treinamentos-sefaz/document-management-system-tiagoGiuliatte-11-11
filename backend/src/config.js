const path = require('path');

const DEFAULT_STORAGE_DIR = path.resolve(__dirname, '..', 'storage');
const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const configuredMaxUploadBytes = process.env.MAX_UPLOAD_BYTES;
const maxUploadBytes = configuredMaxUploadBytes === undefined
  ? DEFAULT_MAX_UPLOAD_BYTES
  : Number(configuredMaxUploadBytes);

if (!Number.isSafeInteger(maxUploadBytes) || maxUploadBytes <= 0) {
  throw new Error('MAX_UPLOAD_BYTES deve ser um inteiro positivo.');
}

module.exports = {
  storageDir: path.resolve(process.env.STORAGE_DIR || DEFAULT_STORAGE_DIR),
  maxUploadBytes,
};
