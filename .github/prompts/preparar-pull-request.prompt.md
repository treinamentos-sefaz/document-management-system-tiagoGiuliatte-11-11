---
description: Prepara título, descrição e checklist de um pull request com base nas mudanças reais do branch.
name: preparar-pull-request
argument-hint: issue/ticket, branch base ou contexto adicional (opcional)
agent: agent
---

# Preparar pull request

Prepare uma proposta de pull request para as mudanças do branch atual. Use o contexto adicional `${input:contexto:issue/ticket, branch base ou contexto (opcional)}` quando fornecido.

Antes de redigir:

- Consulte as instruções relevantes do repositório, o template de PR e as convenções existentes para títulos e commits.
- Identifique o branch atual e o branch base. Prefira o branch base informado; caso contrário, use a configuração ou convenção explícita do repositório. Se não for possível determiná-lo com segurança, informe isso e peça o dado necessário.
- Inspecione o estado do Git e compare as mudanças relevantes com o branch base, incluindo arquivos preparados, não preparados e commits exclusivos do branch.
- Leia os arquivos alterados e testes relacionados o suficiente para descrever corretamente a intenção e o impacto.
- Separe mudanças já existentes no diretório de trabalho das mudanças do branch. Não atribua ao PR alterações que não pertençam a ele.
- Verifique quais testes ou validações relevantes estão disponíveis. Não afirme que algo passou sem executar a verificação e observar o resultado.

Produza:

1. Um título curto, específico e consistente com as convenções do repositório. Se não houver convenção, prefira uma descrição clara da mudança em vez de impor um formato de commit.
2. Uma descrição pronta para colar, seguindo o template do repositório quando existir. Na ausência de template, use seções concisas para contexto/objetivo, mudanças principais, validação e riscos ou observações relevantes.
3. Uma checklist breve de itens pendentes antes da abertura, apenas quando aplicável, como testes ainda não executados, referência de issue ausente ou impacto incompatível que precise de confirmação.

Seja factual e conciso. Inclua referências de issue somente quando fornecidas ou encontradas no contexto do branch. Não invente motivação, resultados de testes, screenshots, impactos ou compatibilidade. Sinalize lacunas e riscos relevantes em vez de escondê-los. Não inclua segredos, tokens ou dados sensíveis nos textos gerados.

Este prompt prepara apenas o conteúdo e a checklist. Não altere arquivos do produto, não faça stage ou commit, não faça push e não abra o pull request.