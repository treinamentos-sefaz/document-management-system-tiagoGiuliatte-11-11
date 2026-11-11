const path = require('path');

const DEFAULT_STORAGE_DIR = path.resolve(__dirname, '..', 'storage');
const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

module.exports = {
  storageDir: process.env.STORAGE_DIR || DEFAULT_STORAGE_DIR,
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES) || DEFAULT_MAX_UPLOAD_BYTES,
};
