# Preparar e enviar ao GitHub

A raiz Git é a pasta que contém `App.tsx` e `package.json`. No workspace original, ela é `mobile/`. Não inicialize outro repositório na pasta acima.

## O que faz parte do projeto

Versione código, assets usados pelo app, `modules/`, `plugins/`, scripts, testes, `app.json`, `eas.json`, configurações de TypeScript/Prettier, `package.json`, `package-lock.json` e os guias em `docs/`. `AGENTS.md` e `CLAUDE.md` são instruções compartilhadas; não contêm configurações pessoais da ferramenta.

O `.gitignore` exclui:

- `node_modules/`, Expo/Metro/cache e bundles em `dist/`.
- `android/` e `ios/` gerados; o Android dentro de `modules/` continua versionado.
- APK/AAB/IPA, saídas Gradle, relatórios e capturas de teste.
- `.tools/`, SDKs/JDKs locais, chave privada e credenciais de assinatura.
- Arquivos `.env*`, com exceção de modelos `.env.example`/`.env.*.example`.
- Configurações/documentação locais `.claude/` e `.codex/`.
- Backups pessoais com o padrão `ritmo-backup*.json`.

A documentação local `.codex/`, a configuração `.claude/` e os APKs em `entrega/` do workspace original estão fora da raiz Git. Os guias necessários a um clone estão em `docs/`. A chave privada e sua cópia segura ficam fora do Git; APKs de distribuição podem ser anexados separadamente a uma release do GitHub.

## Revisar antes do commit

```bash
git rev-parse --show-toplevel
git status --short
git diff
git diff --cached
npm run typecheck
npm test
npm run format:check
```

O `.gitignore` não remove arquivos já rastreados. Confira o índice e o histórico antes de publicar; uma chave já exposta exige tratamento próprio, e apenas apagar o arquivo no commit seguinte não apaga a exposição. Não inclua backups reais de treino, mesmo que tenham sido renomeados e não coincidam com o padrão ignorado.

Depois de revisar o conteúdo desejado:

```bash
git add .
git diff --cached --stat
git diff --cached --check
git commit -m "Documenta e organiza o projeto Ritmo"
```

Os dados do app no aparelho não fazem parte do código versionado.

## Conectar ao GitHub

Crie o repositório de destino no GitHub **vazio**, sem inicializar README, licença ou `.gitignore`, pois estes arquivos já existem aqui. Escolha a visibilidade desejada no GitHub. Obtenha a URL HTTPS ou SSH do repositório criado.

Execute na raiz do projeto, substituindo a URL de exemplo pela real:

```bash
git remote -v
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin HEAD
```

`HEAD` envia a branch atual, sem renomeá-la. Na preparação de 02/10/2026, a branch local se chamava `master`; confirme com `git branch --show-current`.

Se `origin` já existir, confira seu destino antes de alterá-lo. Se o remoto já tiver commits, integre os históricos de forma explícita; não use `push --force` como solução automática. Autentique com o mecanismo do GitHub disponível na máquina, sem colocar token no código, na URL ou nos guias.

Verifique o commit/branch no GitHub após o push. Um commit local não significa que o projeto já foi enviado. Na preparação descrita em [Estado](ESTADO.md), nenhum destino remoto foi configurado.

## Conferir um clone

Em outro diretório, clone o repositório e execute `npm ci`, `npm run typecheck` e `npm test` na raiz. A especificação de importação usada pelo teste está em `docs/IMPORTACAO.md`; nenhuma pasta local de agente é necessária. O build release exige restaurar a chave de distribuição existente por um canal seguro ou criar uma chave nova para uma distribuição independente.
