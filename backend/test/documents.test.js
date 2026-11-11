const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const STORAGE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-storage-'));
process.env.STORAGE_DIR = STORAGE_DIR;
process.env.MAX_UPLOAD_BYTES = '64';

const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(STORAGE_DIR, { recursive: true, force: true });
});

function buildUploadForm(content, fileName, fieldName = 'file') {
  const form = new FormData();
  form.append(fieldName, new Blob([content], { type: 'text/plain' }), fileName);
  return form;
}

async function uploadDocument(content, fileName, headers = {}) {
  return fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers,
    body: buildUploadForm(content, fileName),
  });
}

test('POST /upload grava o arquivo em storage e retorna os metadados com 201', async () => {
  const response = await uploadDocument('conteudo do contrato', 'contrato.txt', { 'X-Owner-Id': 'maria' });

  assert.strictEqual(response.status, 201);
  const metadata = await response.json();
  assert.match(metadata.id, /^[0-9a-f-]{36}$/);
  assert.strictEqual(metadata.originalName, 'contrato.txt');
  assert.strictEqual(metadata.size, Buffer.byteLength('conteudo do contrato'));
  assert.strictEqual(metadata.owner, 'maria');
  assert.ok(!Number.isNaN(Date.parse(metadata.uploadedAt)));
  assert.strictEqual(Object.keys(metadata).length, 5, 'não deve expor o nome físico do arquivo');

  const storedFiles = fs.readdirSync(STORAGE_DIR);
  assert.strictEqual(storedFiles.length, 1);
  assert.match(storedFiles[0], /^[0-9a-f-]{36}\.txt$/);
});

test('POST /upload usa "anonymous" como owner quando o cabeçalho não é enviado', async () => {
  const response = await uploadDocument('sem dono', 'sem-dono.txt');

  assert.strictEqual(response.status, 201);
  assert.strictEqual((await response.json()).owner, 'anonymous');
});

test('POST /upload rejeita requisição sem o campo "file" com 400', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: buildUploadForm('x', 'x.txt', 'outro-campo'),
  });

  assert.strictEqual(response.status, 400);
  assert.ok((await response.json()).error);
});

test('POST /upload rejeita arquivo maior que o limite com 413', async () => {
  const response = await uploadDocument('a'.repeat(200), 'grande.txt');

  assert.strictEqual(response.status, 413);
  assert.ok((await response.json()).error);
});

test('GET /documents lista os metadados enviados', async () => {
  const uploaded = await (await uploadDocument('lista', 'lista.txt')).json();

  const response = await fetch(`${baseUrl}/documents`);

  assert.strictEqual(response.status, 200);
  const documents = await response.json();
  assert.ok(Array.isArray(documents));
  assert.ok(documents.some((doc) => doc.id === uploaded.id && doc.originalName === 'lista.txt'));
});

test('GET /documents/:id/download devolve o conteúdo com o nome original', async () => {
  const uploaded = await (await uploadDocument('bytes do download', 'relatorio.txt')).json();

  const response = await fetch(`${baseUrl}/documents/${uploaded.id}/download`);

  assert.strictEqual(response.status, 200);
  assert.strictEqual(await response.text(), 'bytes do download');
  assert.match(response.headers.get('content-disposition'), /filename="relatorio\.txt"/);
  assert.match(response.headers.get('content-type'), /text\/plain/);
});

test('GET /documents/:id/download retorna 404 para identificador inexistente', async () => {
  const response = await fetch(`${baseUrl}/documents/nao-existe/download`);

  assert.strictEqual(response.status, 404);
  assert.ok((await response.json()).error);
});

test('GET /documents/:id/download retorna 404 quando o arquivo sumiu do disco', async () => {
  const uploaded = await (await uploadDocument('removido', 'removido.txt')).json();
  const [storedFile] = fs
    .readdirSync(STORAGE_DIR)
    .filter((name) => name.endsWith('.txt') && fs.readFileSync(path.join(STORAGE_DIR, name), 'utf8') === 'removido');
  fs.rmSync(path.join(STORAGE_DIR, storedFile));

  const response = await fetch(`${baseUrl}/documents/${uploaded.id}/download`);

  assert.strictEqual(response.status, 404);
});
