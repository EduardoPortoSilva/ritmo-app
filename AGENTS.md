# Ritmo — instruções para agentes

## Leitura inicial

Leia [README.md](README.md), [docs/FUNDAMENTOS.md](docs/FUNDAMENTOS.md) e [docs/DESENVOLVIMENTO.md](docs/DESENVOLVIMENTO.md) antes de alterar o aplicativo. Consulte [docs/ESTADO.md](docs/ESTADO.md) e [TODO.md](TODO.md); valide o estado real dos arquivos e do Git nesta sessão.

No workspace original, o projeto está em `mobile/` e há documentação complementar em `../.codex/`. Se ela estiver disponível, leia também `../.codex/README.md`. Um clone independente usa os guias versionados em `docs/` e não exige a pasta local.

## Acordos de trabalho

- Responda em português brasileiro. Prefira soluções simples de manter e compatíveis com Android.
- Inspecione o diff existente e preserve o trabalho do usuário e de outras sessões.
- Mantenha planejamento e registro separados: editar rotinas não pode reescrever o histórico ou o treino iniciado.
- Preserve os dados locais. Mudanças no formato persistido exigem compatibilidade ou migração explícita.
- Use npm e mantenha `package-lock.json`. Execute os comandos na raiz deste repositório (`mobile/` no workspace original).
- Faça decisões rotineiras dentro do escopo autorizado. Explique bloqueios concretos e não amplie o produto por conta própria.
- Valide conforme a matriz em [Desenvolvimento](docs/DESENVOLVIMENTO.md). Mudança apenas documental exige revisão de conteúdo, links e formatação; não exige recompilar o app.
- Não considere um APK antigo atualizado só porque o código mudou. Informe o que foi compilado e testado.
- Mantenha Kotlin, manifesto e recursos em `modules/` e configurações nativas em `app.json`/`plugins/`; `android/` é gerado.
- Não versione chaves, credenciais, backups pessoais, SDKs, dependências instaladas ou artefatos de teste/build.
- Atualize os guias quando mudar arquitetura, regras, comandos ou limitações. Diferencie validação atual de evidência histórica.
- Esta documentação não exige delegação a subagentes.

## Documentação do Expo

Leia a [documentação exata do Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) antes de escrever código. Confira `package.json` e o lockfile; se o SDK mudar, consulte a versão instalada e atualize este endereço.
