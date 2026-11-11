// Persistência dos metadados em memória. Os metadados não sobrevivem ao reinício.
const documents = new Map();

function save(record) {
  documents.set(record.id, record);
  return record;
}

function findAll() {
  return Array.from(documents.values());
}

function findById(id) {
  return documents.get(id) || null;
}

module.exports = { save, findAll, findById };
