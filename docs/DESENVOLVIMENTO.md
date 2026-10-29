# Como trabalhar no repositório

Todos os comandos abaixo partem da raiz Git, que neste workspace é `mobile/`. Use caminhos relativos em documentação compartilhada; descubra os caminhos locais de SDK e JDK em cada máquina.

## Ambiente e dependências

- Node.js 22.13+; a entrega inicial foi validada com Node 24.
- npm e `package-lock.json` são a referência para instalação reproduzível.
- No PowerShell, use `npm.cmd` e `npx.cmd` se os wrappers `.ps1` estiverem bloqueados.
- Use `npm.cmd ci` para instalar o lockfile existente. Use `npx.cmd expo install <pacote>` para dependências vinculadas ao SDK.
- Confira a versão instalada antes de seguir documentação externa. A base inicial é Expo SDK 57.
- Não aplique `npm audit fix --force` sem analisar a mudança de versões e a compatibilidade.
- Não edite `node_modules/`. Configurações nativas duráveis devem partir de `app.json` ou de um config plugin versionado.

`package.json` mantém um override restrito a `xcode → uuid@11.1.1` para evitar a versão sinalizada pelo advisory de buffer de UUID. O `xcode@3.0.1` usa `require('uuid').v4()`, API CommonJS conferida na atualização de segurança concluída em 14/10/2026. Ao atualizar/remover esse override, valide também a geração de IDs de projeto pelo pacote xcode. `shell-quote` e `source-map-js` recebem versões corrigidas compatíveis com os intervalos dos seus dependentes no lockfile.

## Trabalhar com segurança e autonomia

Inspecione mudanças existentes antes de editar; não reverta alterações alheias nem faça limpeza global do workspace. Decisões rotineiras de implementação e validação devem prosseguir dentro do pedido do usuário.

Limpeza de dados de testes deve ser restrita a um emulador identificado e aos dados fictícios criados para o teste. Não apague dados reais, troque assinatura do app instalado ou faça publicação como parte de uma alteração comum.

Não crie dependências de caminhos pessoais, portas já ocupadas ou sessões antigas de ferramentas. Se houver erro Git de propriedade, confira a raiz e use uma exceção pontual com `git -c safe.directory=<raiz>`; não altere a configuração global de confiança.

## Executar e formatar

```powershell
npm.cmd start
npm.cmd run web
npm.cmd run format:check
```

`start` abre o servidor Expo para uso com Expo Go compatível. `android` executa `expo run:android`, compilando e instalando a versão de desenvolvimento; não é o comando de distribuição do APK.

Use Prettier nos arquivos alterados. Evite reformatação ampla quando houver trabalho não relacionado no diff.

## Validação proporcional à mudança

| Mudança                                       | Verificação esperada                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Apenas documentação                           | Revisar conteúdo, caminhos, links locais e formatação; não recompilar o app.                             |
| Tipos, regras ou persistência                 | `npm.cmd run typecheck` e `npm.cmd test`; incluir casos relevantes para novas regras ou migrações.       |
| Formulários, navegação ou estado da interface | Verificações anteriores e `npm.cmd run test:e2e`; inspecionar a tela alterada em tamanho de celular.     |
| Dependências ou configuração Expo             | `npx.cmd expo-doctor` e bundle da plataforma afetada, além dos testes pertinentes.                       |
| Comportamento nativo ou entrega de APK        | Compilar, instalar no emulador e validar o fluxo afetado. Distinguir validação web de validação Android. |

Os testes de domínio usam `node --test`. Os testes Playwright compilam a versão web de produção e a servem localmente em `127.0.0.1:8081`. Na primeira execução, instale o navegador com `npx.cmd playwright install chromium`.

Para teclado, `tests/keyboard-geometry.test.mts` cobre a área visível e `tests/e2e/keyboard-scroll.spec.ts` reduz o viewport em formulários, séries, modais e JSON longo. Reduzir o viewport no Playwright não abre um IME Android real. Valide também em AVD exclusivo com teclado virtual habilitado: o campo e rótulo devem ficar acima do teclado, a rolagem manual deve permanecer disponível e Salvar deve funcionar no primeiro toque. Não use dados pessoais para esse ensaio; registre os limites da versão Android efetivamente testada em `docs/ESTADO.md`.

O Playwright limpa `.playwright-results/` antes de cada execução; traces e capturas de falhas ficam nesse diretório descartável. `test-results/` guarda capturas nomeadas e relatos manuais e não deve ser usado como `outputDir`. Preserve as evidências de rodadas anteriores.

Confira se a porta 8081 está livre ou se o servidor existente é o correto: a configuração permite reutilização fora de CI. O script `test:e2e` já executa `build:web`; não é necessário duplicar a compilação.

`npm.cmd run build:android` exporta o bundle JavaScript Android e **não gera APK**. `build:web` gera `dist/`. Ambos usam esse diretório de saída, portanto não execute essas exportações simultaneamente.

## Build Android local

Requisitos validados: Android SDK 36 e JDK 17. O Java padrão da máquina pode ser antigo ou incompatível; verifique `java -version`, `JAVA_HOME` e `ANDROID_HOME`. O JDK 25 do Android Studio local falhou na etapa CMake da entrega inicial; JDK 17 funcionou.

Configure variáveis somente no processo de build, usando os caminhos reais da máquina, e execute:

```powershell
npx.cmd expo prebuild --platform android --no-install
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-release.ps1
```

A saída fica em `android/app/build/outputs/apk/release/app-release.apk`. ARM64 atende os celulares compatíveis desta entrega; x86_64 permite validar no emulador usado.

`android/` e `ios/` são gerados e ignorados pelo Git. Prebuild pode regenerar arquivos; confirme que não há alterações nativas manuais importantes antes de executá-lo. Não trate correções feitas apenas nesses diretórios como solução durável.

O build release exige a chave privada local em `.tools/signing/`; sem ela, o Gradle falha em vez de usar a chave de desenvolvimento. Gere a chave uma única vez com `scripts/create-release-key.ps1`, guarde uma cópia segura de ambos os arquivos e siga [Backup e assinatura](BACKUP-E-ASSINATURA.md). Builds debug continuam usando a chave de desenvolvimento. `eas.json` contém perfis de nuvem, mas a assinatura local configurada aqui não se aplica automaticamente ao EAS.

### Compilar e instalar no Pixel com um comando

No Windows, abra o AVD **Pixel 7 (2)** (`Pixel_7_2`) e execute em `mobile/`:

```powershell
npm.cmd run apk:pixel
```

`scripts/build-install-pixel.ps1` encontra o emulador pelo nome, aguarda até 120 segundos pelo boot, executa o prebuild Android e chama `scripts/build-release.ps1 -NoDaemon`. Em seguida, confere assinatura, pacote/versão do APK e o AVD novamente, instala com `adb install -r`, compara o SHA-256 do APK instalado com o compilado e abre o Ritmo. Dispositivos físicos e AVDs de outro nome são recusados; se a assinatura instalada for incompatível, o Android recusa a atualização e os dados ficam preservados. Falhas de compilação interrompem o fluxo antes de qualquer instalação.

Requer Node, dependências instaladas, JDK 17, SDK Android e a assinatura privada existente. O SDK vem de `ANDROID_HOME`, `ANDROID_SDK_ROOT` ou `%LOCALAPPDATA%\Android\Sdk`; o JDK local em `.tools/jdk17/jdk-17.0.20.1+1` tem prioridade sobre `JAVA_HOME`. A saída permanece em `android/app/build/outputs/apk/release/app-release.apk`. O comando usa a versão definida em `app.json`; para distribuir uma nova entrega, incremente o `versionCode` e siga a cópia/verificação em [Backup e assinatura](BACKUP-E-ASSINATURA.md).

Para alterações somente em JavaScript/TypeScript, é possível reutilizar a configuração Android gerada e evitar o prebuild:

```powershell
npm.cmd run apk:pixel -- -SkipPrebuild
```

Use o comando padrão após alterar `app.json`, plugins ou dependências. Sem a pasta Android, mesmo `-SkipPrebuild` prepara o projeto. Execute os testes da matriz de validação conforme a alteração; o comando de instalação faz a compilação e as conferências do APK/AVD.

Para selecionar outro AVD de teste ou resolver ambiguidade entre emuladores:

```powershell
npm.cmd run apk:pixel -- -AvdName Pixel_7_2 -Serial emulator-5554 -BootTimeoutSeconds 180
```

O AVD precisa estar ligado. Se outro build/daemon deste projeto mantiver arquivos bloqueados no prebuild, encerre esse processo antes de repetir. `-NoDaemon` faz o Gradle desta execução terminar após o build, reduzindo bloqueios nas próximas rodadas; o instalador não encerra processos de outros projetos.

## Teste no emulador e entrega

O roteiro `node tests/android-smoke.mjs` exige instalação limpa do APK no emulador Pixel 7 usado nos testes (1080 × 2400). O serial padrão é `emulator-5554`, ajustável por `ANDROID_TEST_SERIAL`. Ele recusa seriais de dispositivos físicos e cria uma rotina e um treino fictícios.

Espere `sys.boot_completed` retornar `1` antes de instalar. O roteiro cobre cadastro, série realizada, encerramento do processo, retomada e histórico. As capturas ficam em `test-results/`.

Ao entregar novo APK, copie o arquivo recém-compilado para o diretório de entrega combinado com o usuário, verifique a assinatura e atualize o SHA-256. No workspace original, os artefatos ficam em `../entrega/`, fora da raiz Git. Preserve a distinção entre código atual e artefato anteriormente gerado.

Encerre somente servidores, emuladores e processos auxiliares que você iniciou. Não interrompa processos do usuário. Não rode todas as compilações pesadas ao mesmo tempo: isso causou atrasos e timeouts durante a primeira entrega.

## Módulo local do widget

O widget Android fica em `modules/ritmo-widget/`, ligado automaticamente pelo Expo. Mantenha Kotlin, manifesto e recursos nesse diretório; não copie a solução apenas para `android/` gerado. O Expo Go não inclui esse módulo: o app permanece funcional, mas sem widget. Não há alteração obrigatória no `app.json` nem pacote nativo externo adicional.

Após alterar o módulo, compile o APK e execute também `:ritmo-widget:testDebugUnitTest` no Gradle. Os testes JVM usam JUnit apenas como dependência de teste. O cálculo nativo é a referência de calendário; os testes Node validam a projeção dos dados e os fluxos web continuam cobrindo a regressão do app. Mudanças no código nativo exigem novo APK, não apenas recarga do JavaScript.

O roteiro manual está em `modules/ritmo-widget/README.md`. Use AVD exclusivo e dados fictícios para testar estados pendentes, concluídos e descanso, nomes longos, fonte ampliada e formatos 1×2, 3×1 e 4×1 nos dois widgets. Não use o histórico do usuário para esse teste. `adb shell am kill <pacote>` testa encerramento de processo em segundo plano; `force-stop` tem semântica diferente e pode desativar widgets no Android até reabrir o app.

## Suplementos e lembretes

O módulo `modules/ritmo-reminders/` contém as notificações locais e o widget de suplementos. Além dos testes Node e Playwright, execute `:ritmo-reminders:testDebugUnitTest` e mantenha `:ritmo-widget:testDebugUnitTest` como regressão. `app.json` define o esquema `ritmo`; mudanças nesse esquema exigem prebuild. As permissões de notificação/reinício vêm do manifesto versionado do módulo. Notificações usam alarmes não exatos; não adicione permissão de alarme exato automaticamente.

Use emulador separado com suplementos fictícios para testar permissão, horários, cancelamento, recebimento real de aviso, abertura por link e estados do widget. Não cadastre hábitos ou altere permissões no emulador principal do usuário apenas para gerar evidência de teste. Roteiro detalhado em `modules/ritmo-reminders/README.md`.

No Windows, o daemon Gradle pode manter arquivos de build bloqueados durante prebuild. Identifique o daemon deste projeto e encerre-o antes de regenerar; não apague código versionado para contornar o problema. Confirme a assinatura do APK anterior e a chave regenerada antes de instalar atualização, preservando os dados existentes.

## Aviso de descanso em segundo plano

O módulo Android local `modules/ritmo-rest/` entrega os três bipes enquanto o usuário abre outro app ou apaga a tela durante um descanso iniciado na tela de treino. Após mudar Kotlin, manifesto ou WAV, rode prebuild, compile o APK e teste no AVD isolado: comece 10 s, aperte Home, confira o log `RitmoRestCue` de início/conclusão antes de voltar ao Ritmo; repita com a tela apagada. Pause antes do fim e confirme que não há conclusão. O serviço exige notificação persistente e as permissões normais de foreground service e wake lock. A redução real do som de outro aplicativo precisa de ensaio audível em aparelho físico; o log de foco de áudio comprova apenas a solicitação ao sistema.
