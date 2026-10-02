# Ritmo

**Seu espaço de treino: planeje suas rotinas, registre cada série e acompanhe sua evolução.**

Aplicativo pessoal de musculação, cardio e hábitos diários, com interface em português brasileiro e armazenamento local. Funciona sem conta e sem backend. Android é a plataforma principal; a versão web serve para desenvolvimento e testes.

## Funcionalidades

- **Planejamento de força:** rotinas avulsas, divisões como ABC, dias da semana, metas e descansos individuais por série.
- **Conjuntos de rotinas:** guarde planos anteriores, alterne o conjunto ativo e pause o planejamento de força preservando os dados.
- **Execução:** um exercício por vez, carga e repetições realizadas, confirmação de séries, descanso com pausa/retomada e recuperação do treino em andamento.
- **Histórico e gráficos:** sessões completas ou parciais, volume, duração, carga máxima, repetições, carga efetiva total e peso corporal opcional.
- **Cobertura muscular:** vínculos principais/secundários escolhidos pelo usuário e mapa esquemático de frente e costas.
- **Cardio:** etapas de duração e velocidade, cronômetro, pausa/retomada e distância esperada/real no histórico.
- **Suplementos:** registro diário, sequência de dias e lembretes locais opcionais no Android.
- **Importação por texto:** planejamento em JSON `ritmo/1`, com conferência e prévia antes de importar o lote.
- **Backup manual:** exportação e restauração do banco completo em JSON `ritmo-backup/1`.
- **Android nativo:** widgets de treinos e suplementos e aviso de descanso mesmo com outro app aberto ou a tela apagada.

Os dados do navegador e do Android são independentes. Não há sincronização automática, prescrição de exercícios ou doses, nem controle da esteira.

## Começar a desenvolver

Requisitos: Node.js **22.13+**, npm e Git. A preparação deste repositório foi verificada com Node 24.19.0 e npm 11.17.0. As versões instaladas vêm do [package-lock.json](package-lock.json).

Depois de clonar, entre na pasta que contém `package.json`:

```bash
npm ci
npm run web
```

Para abrir o servidor Expo:

```bash
npm start
```

No workspace original, execute os comandos dentro de `mobile/`. Em um clone do repositório, essa pasta pode ser a própria raiz. No PowerShell, use `npm.cmd` e `npx.cmd` se os wrappers `.ps1` estiverem bloqueados.

Expo Go compatível permite experimentar a interface, mas não inclui os três módulos Android locais. Para testar widgets, lembretes e descanso nativo, configure o Android SDK/JDK e compile o app:

```bash
npm run android
```

Esse comando compila e instala uma versão de desenvolvimento. O APK de distribuição tem um fluxo separado, descrito abaixo. O comando iOS existe no template, mas essa plataforma não foi validada.

## Plataformas

| Recurso                                          | APK Android     | Web                              | Expo Go                                  |
| ------------------------------------------------ | --------------- | -------------------------------- | ---------------------------------------- |
| Rotinas, séries, histórico e gráficos            | Sim             | Sim                              | Sim                                      |
| Cardio, suplementos e importação de planejamento | Sim             | Sim                              | Sim                                      |
| Backup por arquivo                               | Seletor Android | Arquivo no navegador             | Depende da disponibilidade das APIs Expo |
| Widgets e lembretes locais de suplementos        | Sim             | Não                              | Não                                      |
| Aviso de descanso em segundo plano               | Serviço nativo  | Depende da tela/JavaScript ativo | Depende da tela/JavaScript ativo         |

O aviso de mudança de velocidade do **cardio** depende do painel aberto e do JavaScript ativo, inclusive no Android. O serviço de segundo plano é específico do descanso de força.

## Stack e organização

Expo SDK 57, React Native 0.86.3, React 19.2.3 e TypeScript com modo estrito. Persistência em AsyncStorage; desenho do corpo em SVG; módulos Android locais em Kotlin; testes Node e Playwright. Consulte a [referência do Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) para a base nativa.

```text
.
├── App.tsx                 # Estado, navegação, persistência e confirmações
├── index.ts                # Entrada do Expo
├── src/                    # Domínio, telas, gráficos e pontes nativas
├── modules/
│   ├── ritmo-widget/       # Widget Android de treinos
│   ├── ritmo-reminders/    # Lembretes e widget de suplementos
│   └── ritmo-rest/         # Serviço Android do aviso de descanso
├── plugins/                # Regras Android de backup e assinatura release
├── scripts/                # Servidor web e build/assinatura local
├── tests/                  # Testes de domínio, e2e web e roteiro Android
├── assets/                 # Ícones, vetores e áudio
├── docs/                   # Documentação versionada do projeto
├── app.json                # Configuração Expo e versão Android
└── package-lock.json       # Dependências reproduzíveis
```

`android/`, `ios/` e `dist/` são gerados e ficam fora do Git. Mudanças nativas duráveis pertencem a `modules/`, `plugins/` ou `app.json`.

## Comandos principais

| Comando                 | Finalidade                                                   |
| ----------------------- | ------------------------------------------------------------ |
| `npm start`             | Servidor Expo                                                |
| `npm run web`           | Desenvolvimento no navegador                                 |
| `npm run android`       | Compilar e instalar Android de desenvolvimento               |
| `npm run typecheck`     | Validar TypeScript                                           |
| `npm test`              | Testes de domínio e persistência                             |
| `npm run test:e2e`      | Exportar web de produção e executar Playwright               |
| `npm run format:check`  | Conferir formatação                                          |
| `npm run build:web`     | Gerar bundle web em `dist/`                                  |
| `npm run build:android` | Exportar JavaScript Android; **não gera APK**                |
| `npm run apk:cloud`     | Perfil EAS preview; exige configuração de conta e assinatura |

Antes do primeiro teste web, instale o navegador com `npx playwright install chromium`. O Playwright usa `127.0.0.1:8081`. As exportações web/Android compartilham `dist/`; execute-as separadamente.

## Gerar APK de distribuição

O build local usa **Android SDK 36 e JDK 17**. Configure `JAVA_HOME` e `ANDROID_HOME` para os caminhos da sua máquina.

Em uma máquina nova, restaure a chave e as credenciais de distribuição existentes em `.tools/signing/` quando precisar atualizar um APK já distribuído. Para uma distribuição nova, o script abaixo cria uma chave uma única vez:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\create-release-key.ps1
```

Depois:

```powershell
npx.cmd expo prebuild --platform android --no-install
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-release.ps1
```

Saída: `android/app/build/outputs/apk/release/app-release.apk`, com ARM64 e x86_64. O build release recusa a ausência da assinatura privada. **Guarde a chave e as credenciais fora do Git:** o Android exige a mesma chave para atualizar uma instalação existente.

Detalhes, verificação da assinatura e cuidados com atualização em [Backup e assinatura](docs/BACKUP-E-ASSINATURA.md). O fluxo EAS tem configuração própria de credenciais e não foi validado como entrega equivalente ao build local.

## Dados e privacidade

O banco tem `version: 1` e fica na chave `@ritmo/database/v1`. Editar o planejamento não modifica sessões iniciadas ou o histórico. As gravações são serializadas e erros de leitura não apagam o conteúdo salvo.

O backup automático Android está desativado. Exporte manualmente antes de desinstalar ou trocar de aparelho. O arquivo de backup é legível e não possui criptografia própria. A restauração **substitui** todo o banco local após prévia e confirmação; a importação `ritmo/1` **acrescenta** apenas planejamento.

Leia [modelo de dados](docs/DADOS.md), [backup](docs/BACKUP-E-ASSINATURA.md) e [segurança](SECURITY.md).

## Documentação e manutenção

O [índice de documentação](docs/README.md) reúne o guia de uso, arquitetura, regras, testes, cardio, músculos, importação e publicação no Git. Para contribuir, leia [CONTRIBUTING.md](CONTRIBUTING.md) e [AGENTS.md](AGENTS.md).

Versão do app: **1.0.0**, Android `versionCode` **4**. [Estado e validação](docs/ESTADO.md) separa as verificações atuais das evidências históricas. APKs e relatórios locais não acompanham automaticamente um clone do código.

## Licença

O repositório contém a [licença MIT](LICENSE) do template Expo; o aviso original foi preservado. As fontes anatômicas e a origem do desenho estão documentadas em [Músculos](docs/MUSCULOS.md).
