# Especificação - Document Management System

> Especificação proposta para orientar a implementação do DMS. O backend implementa os endpoints de documentos descritos na seção 6; as decisões tomadas durante a implementação estão listadas na seção 7 e na seção 8 do estado atual.

## 1. Objetivo

Permitir que usuários enviem, listem e baixem documentos, armazenando os arquivos no filesystem local da aplicação e mantendo seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de documentos por HTTP.
- Listagem dos metadados dos documentos enviados.
- Download de um documento pelo identificador.
- Associação de cada documento a um identificador de proprietário (`owner`), sem definir nesta especificação como a identidade do usuário é estabelecida.
- Armazenamento de arquivos em `backend/storage` e de metadados em memória.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Versionamento de documentos.

### Limites e premissas

- Os metadados em memória não sobrevivem ao reinício do processo. O comportamento para arquivos que permaneçam no disco sem metadados correspondentes ainda precisa ser definido.
- Autenticação, origem do identificador do usuário e política de autorização por proprietário não estão especificadas. O campo `owner` não implica, por si só, um mecanismo de autenticação ou controle de acesso.
- Formatos aceitos, limites de tamanho, paginação, ordenação e políticas de retenção ainda precisam ser definidos.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um documento por `multipart/form-data`. O arquivo deve ser gravado localmente e os metadados do documento devem ser registrados em memória. |
| RF-02 | O usuário pode listar os metadados dos documentos enviados. A origem da identidade do usuário e a regra de filtragem por `owner` precisam ser definidas antes de implementar o isolamento entre usuários. |
| RF-03 | O usuário pode solicitar o download de um documento pelo identificador. A política de autorização por proprietário precisa ser definida antes de restringir o acesso. |
| RF-04 | Cada registro de documento deve incluir o identificador do proprietário em `owner`; a fonte e a validação desse identificador estão pendentes. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos enviados devem ser gravados no filesystem local da aplicação, na pasta `backend/storage`, usando Multer com `diskStorage`. |
| RNF-02 | Os metadados devem permanecer em memória nesta fase. A perda do catálogo após reinício deve ser considerada no comportamento operacional e nos testes. |
| RNF-03 | A configuração da aplicação deve usar variáveis de ambiente conforme o princípio 12-Factor. `PORT` tem padrão `3000`; outras variáveis e a configuração do diretório de armazenamento ainda não estão definidas. |
| RNF-04 | O backend deve tratar erros nas fronteiras de entrada HTTP e nas operações de leitura e escrita de arquivos. O contrato de erro observável pela API ainda precisa ser definido. |
| RNF-05 | A solução não deve depender de provedores ou serviços de armazenamento externos. |

## 5. Modelo de dados

### Metadados do documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único usado nas operações de listagem e download. O formato e o mecanismo de geração ainda não estão definidos. |
| `originalName` | string | Nome original do arquivo enviado. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload no formato ISO 8601. |
| `owner` | string | Identificador do usuário proprietário. A origem e a validação do valor ainda não estão definidas. |

Os cinco campos acima são os metadados expostos nos contratos desta especificação. O nome físico usado para armazenar o arquivo não faz parte desse objeto público; a estratégia de nomeação e a associação interna entre o arquivo e `id` devem ser definidas na implementação, sem permitir colisões que sobrescrevam documentos existentes.

## 6. Contratos de API

Os caminhos abaixo são os contratos planejados no backend, ainda não implementados. No desenvolvimento do frontend, o prefixo `/api` é encaminhado pelo proxy do Vite e removido antes da requisição chegar ao backend; esse prefixo não faz parte dos caminhos de rota listados aqui.

### `POST /upload`

- Entrada: `multipart/form-data` contendo um arquivo. O nome do campo multipart ainda precisa ser definido.
- Processamento esperado: gravar o arquivo em `backend/storage` com Multer `diskStorage` e registrar seus metadados em memória.
- Saída de sucesso: objeto JSON de metadados do documento criado, com `id`, `originalName`, `size`, `uploadedAt` e `owner`.
- O código HTTP de sucesso, o esquema de erro, os limites e os tipos de arquivo aceitos ainda precisam ser definidos.

### `GET /documents`

- Entrada: sem parâmetros obrigatórios definidos nesta especificação.
- Saída de sucesso: lista JSON de objetos de metadados com os campos definidos no modelo de dados.
- Filtros, ordenação, paginação e regra de seleção por `owner` ainda precisam ser definidos.

### `GET /documents/:id/download`

- Entrada: identificador do documento no parâmetro `id`.
- Saída de sucesso: conteúdo binário do arquivo correspondente.
- MIME type, cabeçalhos de disposição/nome do arquivo, resposta para identificador inexistente e política de autorização ainda precisam ser definidos.

### Erros e validação

Os códigos HTTP e o formato comum das respostas de erro não estão definidos no modelo inicial. Devem ser especificados antes da implementação dos contratos, incluindo falhas de validação do upload, erros de filesystem e documento não encontrado.

## 7. Decisões arquiteturais

### Backend

- Node.js e Express, em CommonJS.
- Manter o fluxo de dependência `routes -> controllers -> services -> repositories`.
- Rotas definem endpoints e delegam aos controllers; controllers tratam a entrada e a saída HTTP e validação básica; services concentram regras de negócio; repositories cuidam da persistência de metadados.
- Usar Multer com `diskStorage` para gravação local dos arquivos em `backend/storage`; não usar armazenamento externo.
- Manter os metadados em memória nesta fase. A divisão concreta de responsabilidades entre o upload HTTP e o registro de metadados deve respeitar as camadas acima.

### Frontend

- React com componentes funcionais e Hooks, organizado em `components/`, `pages/` e `services/`.
- A comunicação com o backend deve usar `fetch` através do prefixo `/api`, com o proxy de desenvolvimento configurado pelo Vite.

### Estado atual

- O backend implementa `GET /health`, `POST /upload`, `GET /documents` e `GET /documents/:id/download`, nas camadas `routes -> controllers -> services -> repositories`.
- Decisões tomadas na implementação, pendentes de confirmação na especificação: campo multipart `file`; sucesso `201` no upload e `200` nas demais rotas; erros no formato `{ "error": "..." }`; limite de tamanho configurável por `MAX_UPLOAD_BYTES` (padrão 10 MB); diretório configurável por `STORAGE_DIR` (padrão `backend/storage`); `owner` lido do cabeçalho `X-Owner-Id` (padrão `anonymous`), sem autenticação nem filtro por proprietário.
- `GET /documents` mantém a resposta de lista completa quando chamado sem parâmetros. `limit` (1 a 100) e `offset` (inteiro não negativo) habilitam paginação opcional; nesse modo, `X-Total-Count` informa o total de registros.
- A interface implementa os fluxos de envio, listagem e download, com componentes `UploadComponent`, `DocumentList` e `DownloadButton` e o cliente HTTP em `frontend/src/services/documentService.js`, que usa o prefixo `/api`.

## 8. Plano de execução

As etapas abaixo descrevem trabalho futuro em nível conceitual. Esta especificação não executa nem detalha alterações em arquivos de backend ou frontend.

1. Definir as decisões pendentes que afetam os contratos: identidade e autorização do proprietário, validação e limites de upload, erros HTTP, listagem e cabeçalhos de download.
2. Implementar o fluxo de documentos no backend conforme as camadas arquiteturais: upload local com Multer `diskStorage`, registro e consulta de metadados em memória, listagem e download.
3. Verificar os contratos e os casos de erro do backend, incluindo falhas de filesystem e a consequência do reinício sobre os metadados.
4. Implementar no frontend os fluxos de envio, listagem e download usando os serviços HTTP existentes no padrão do projeto.
5. Integrar e validar os fluxos completos, confirmando o armazenamento estritamente local e a associação de metadados aos arquivos.
6. Revisar a documentação e os testes para manter requisitos, contratos e comportamento implementado consistentes.
