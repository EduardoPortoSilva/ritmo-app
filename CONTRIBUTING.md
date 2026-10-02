# Contribuir com o Ritmo

Leia o [README](README.md), os [fundamentos](docs/FUNDAMENTOS.md) e as [instruções para agentes](AGENTS.md). O projeto prioriza manutenção simples, Android e dados locais preservados. Backend, contas e sincronização não fazem parte do produto implementado.

## Preparação

```bash
npm ci
npx playwright install chromium
npm run web
```

Execute os comandos na pasta de `package.json`. Use o lockfile; para dependências Expo, prefira `npx expo install <pacote>`, seguindo a [versão do SDK instalada](https://docs.expo.dev/versions/v57.0.0/). Não edite `node_modules/`.

## Fazer uma mudança

1. Confira `git status` e `git diff` e preserve alterações que já existam.
2. Mantenha regras de domínio fora das telas quando possível. `App.tsx` coordena estado e navegação; `src/storage.ts` coordena gravações.
3. Preserve os snapshots de sessões e a leitura do banco v1. Acrescente testes de regra ou migração quando o comportamento mudar.
4. Faça alterações Android duráveis em `modules/`, `plugins/` ou `app.json`.
5. Atualize o guia correspondente em `docs/` e formate somente os arquivos envolvidos.
6. Descreva o problema, o resultado e a validação na revisão/commit. Não declare teste Android com base apenas em Playwright.

## Validação

| Mudança                               | Verificações                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| Documentação                          | Conteúdo, links relativos e Prettier                                         |
| Domínio, tipos ou persistência        | `npm run typecheck` e `npm test`                                             |
| Interface ou navegação                | Verificações anteriores e `npm run test:e2e`; inspeção em tamanho de celular |
| Dependências/Expo                     | Expo Doctor, exportação afetada e testes pertinentes                         |
| Kotlin, manifesto ou recursos nativos | Novo APK, testes JVM pertinentes e fluxo no emulador dedicado                |

Detalhes e comandos em [Desenvolvimento](docs/DESENVOLVIMENTO.md). Use dados fictícios e um emulador dedicado. Não limpe dados reais nem altere a assinatura de uma instalação existente para testar.

Antes de registrar uma mudança, revise `git diff --cached` e confirme que a chave privada, os backups pessoais e os artefatos gerados não entraram no índice. O [guia de Git](docs/GIT.md) explica os arquivos incluídos e excluídos.

## Critérios de revisão

O funcionamento deve continuar offline, com textos em português, alvos acessíveis e respeito ao teclado/botão Voltar do Android. Erros de leitura devem preservar os dados. Rotinas editadas não podem alterar o histórico. Caches de widgets/lembretes são derivados, e a restauração continua exclusiva e conferida.

Relate problemas de segurança seguindo [SECURITY.md](SECURITY.md), sem publicar dados de treino ou credenciais.
