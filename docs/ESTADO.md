# Estado e validação

Referência: **14/10/2026**. O código continua sendo a fonte de verdade. Resultados históricos pertencem à entrega mencionada e não substituem testes de uma alteração futura.

## Código atual

Aplicativo `com.ritmo.treinos`, versão **1.0.5**, Android `versionCode` **13**. Base instalada registrada no lockfile: Expo **57.0.28**, React Native **0.86.3**, React **19.2.3**. Android é a plataforma principal; web facilita desenvolvimento/testes; iOS não foi validado.

Implementados: força com divisões/conjuntos e pausa do planejamento, programação semanal, séries e descansos individuais, retomada de sessão, histórico e gráficos, peso corporal, vínculos/mapa muscular, cardio por etapas com distância, suplementos diários, widgets/lembretes Android, importação `ritmo/1` e backup completo `ritmo-backup/1`.

## Entrega após a reauditoria — build 13, 14/10/2026

APK release 1.0.5/build 13 compilado com JDK 17/SDK 36, ARM64 e x86_64, incorporando as novas validações de backup e dependências. Assinatura v2 válida, com o mesmo certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`; nenhuma chave foi criada/substituída. O manifesto mantém `allowBackup=false`, OTA desativado, serviços/receptores próprios não exportados e remoção das permissões bloqueadas. Regras compiladas: 9 exclusões de backup completo e 27 nas políticas de extração/transferência. O bundle empacotado corresponde ao gerado pelo Gradle; as 40 fontes próprias do mapa correspondem exatamente ao código atual.

No AVD exclusivo **Ritmo_Build13_QA**, Android 15/35, `emulator-5564`, a atualização build 12 → 13 preservou exatamente o JSON fictício com uma rotina, um treino histórico e treino ativo com uma série concluída. Após atualizar, a sessão foi retomada com `1/3 séries`. Backup com ID duplicado foi recusado pelo seletor nativo antes da prévia, preservando o mesmo banco. Backup v1 válido abriu a prévia, exigiu confirmação, foi restaurado e manteve o mesmo JSON conferido no disco. O roteiro nativo de cadastro, registro, retomada e histórico foi executado inicialmente no build 12 para montar o cenário de atualização. O emulador do usuário (`emulator-5554`) não foi alterado nesta entrega.

Ainda no build 13, descanso de 10 s iniciado pela interface registrou início e conclusão no `RitmoRestCue` com o Ritmo em segundo plano. Cardio de três etapas de 10 s registrou dois avisos de troca de velocidade no `RitmoCardioCue` com a tela apagada. O AVD foi iniciado sem áudio: os logs confirmam a execução nativa, sem afirmar audibilidade ou redução real de volume em aparelho físico. Evidências em `native-cues.json` e nos dois logs de cue da pasta desta entrega.

A reauditoria anterior desta mesma data passou em TypeScript, **66 testes Node**, **32 fluxos Playwright**, **14 testes JVM**, Expo Doctor **21/21**, 261 mutações de entradas e cenários extras de rollback. Assinaturas de 516 pacotes npm e 125 atestações foram verificadas. Permanecem 15 ocorrências altas transitivas das ferramentas de build (`braces`/`node-forge`), sem novas falhas encontradas no código. Evidências da auditoria em `.tools/security-reaudit-2026-10-14/`; da entrega nativa em `.tools/release-build13-2026-10-14/`.

APK atual: `../entrega/ritmo-android.apk`, **50.250.632 bytes**, SHA-256 `6146db785cc7a78e9d4f63ca7f9b65d1c230296954e95c50e946b2975e0283ea`; cópia conferida e `SHA256SUMS.txt` atualizado. O build 12 foi preservado em `../entrega/ritmo-android-20261013-877eeb4e.apk`. Não houve instalação em aparelho físico ou atualização do emulador do usuário.

## Correção da auditoria de segurança — código, 14/10/2026

O parser compartilhado pelo carregamento, exportação e restauração passou a recusar IDs de força vazios/repetidos no escopo correto, rotinas sem exercícios, metas inválidas e sessões sem exercícios/séries. Os limites seguem o formulário: de 1 a 20 séries por exercício e metas de 1 a 999 repetições. Séries pendentes continuam aceitando valores ainda não concluídos; campos opcionais antigos e referências de exercícios entre snapshots permanecem compatíveis. Não houve alteração da versão/chave do banco, deduplicação automática ou limpeza de dados.

Dependências atualizadas dentro do SDK 57: Expo 57.0.28, expo-asset 57.0.19 e expo-sharing 57.0.23. O lockfile agora usa shell-quote 1.12.0 e source-map-js 1.2.2; override restrito a xcode fixa uuid 11.1.1 com CommonJS compatível. A geração de IDs pelo xcode e a recusa do payload do advisory de shell-quote foram conferidas em um probe isolado. Nenhum downgrade de SDK ou `audit fix --force` foi aplicado.

Validação atual: TypeScript, **66 testes Node**, **32 fluxos Playwright**, exportação web e Android aprovados; Expo Doctor **21/21**. A regressão web recusa quatro backups malformados antes da prévia e confere que o JSON persistido não mudou. Os testes Node cobrem duplicatas, IDs vazios, metas inválidas, limites de séries, snapshots antigos e rascunhos de sessões parciais.

A consulta npm após a correção mantém **15 ocorrências altas, zero críticas/moderadas**, derivadas de `braces@3.0.3` e `node-forge@1.4.0` nas ferramentas Metro/CLI; não havia versão corrigida publicada na consulta. São pendências upstream, sem exploração demonstrada no runtime do app. Evidências locais em `.tools/security-review-2026-10-13/`, incluindo `npm-audit-after.json`.

Essa validação da correção precedeu a geração do APK. O build 13 descrito acima incorporou as mudanças e acrescentou a verificação nativa de atualização e backup; o build 12 abaixo permanece como registro histórico.

## Grade de atalhos e confirmação da pausa — build 12, 13/10/2026

Os seis atalhos da aba Rotinas passaram a duas linhas de três, em `src/RoutineActions.tsx`, com rótulos curtos e nomes acessíveis completos. Pausar, Backup e Conjuntos mantêm seus ícones; Cobertura usa braço flexionado, Cardio usa coração com batimento e Importar usa robô, com a fonte MaterialCommunityIcons já disponível no pacote de ícones. Nova divisão e Nova rotina ficam fora da grade. Sem rotinas visíveis, Pausar fica desabilitado; quando pausado, o mesmo atalho oferece Retomar força.

Pausar abre uma confirmação antes de alterar o planejamento. Confirmar pausa aplica; Cancelar ou Voltar do Android apenas fecham. O diálogo explica o alcance sobre lista/widget e a preservação de dados, sessões ativas, cardios e histórico. Retomar permanece imediato. Nenhuma mudança no formato do banco ou nas regras de treino.

Validação: TypeScript, **62 testes Node**, **31 fluxos Playwright**, exportação web e Prettier dos arquivos alterados aprovados. Verificados alinhamento 3×2 em 320/390 px, seis destinos, Nova divisão separada, cancelamento sem pausar, confirmação, persistência da pausa e retomada. Captura web em `test-results/rotinas-grade-20261013.png`. APK release ARM64/x86_64 compilado; pacote/versão/assinatura conferidos. Atualização do build 11 para o 12 no **Pixel_7_2** (`emulator-5554`) preservou exatamente o JSON anterior, com uma rotina, 14 sessões e treino ativo.

No Android, conferidos grade 3×2, ícones, Nova divisão separada, navegação dos cinco atalhos de consulta/gerenciamento, modal de pausa, Cancelar e Voltar. A leitura após encerrar o processo confirmou exatamente o mesmo JSON anterior aos testes: nenhuma pausa foi aplicada no emulador do usuário. A confirmação que aplica/persiste a pausa e a retomada foram exercitadas na web. Capturas em `test-results/pixel-routine-grid-20261013/`; deixado o app na aba Rotinas para consulta. Sem teste em aparelho físico.

APK daquela entrega, agora arquivado em `../entrega/ritmo-android-20261013-877eeb4e.apk`: **50.249.284 bytes**, SHA-256 `877eeb4e6992ab9d17f3b235003f40cb813d3a3a5341d24f73d3f0d9932522b7`, certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`. O build 11 foi arquivado em `../entrega/ritmo-android-20261013-f8a6eee6.apk`.

## Observação no cabeçalho e modal de edição — build 11, 13/10/2026

Durante a execução, a observação aparece somente no cabeçalho do exercício, com um lápis para abrir `ExerciseNoteModal`. Quando vazia, mostra “Adicionar observação” e mantém o lápis disponível. O campo aberto abaixo das séries foi removido. O modal usa um rascunho local: Salvar observações atualiza a sessão e o planejamento correspondente; Cancelar, X e Voltar do Android fecham sem persistir o rascunho. Editor de planejamento e snapshots históricos continuam com suas próprias observações.

Validação: TypeScript, **62 testes Node**, **30 fluxos Playwright**, exportação web e Prettier dos arquivos alterados aprovados. Fluxos cobrem cancelamento/fechamento, salvamento, observação vazia, remoção, retomada e preservação do histórico/séries concluídas. Inspecionados cabeçalho e modal em viewport 390×844. APK release ARM64/x86_64 compilado e assinatura/pacote/versão verificados; atualização do build 10 para o 11 no **Pixel_7_2** (`emulator-5554`) preservou exatamente o JSON anterior, com uma rotina, 14 sessões e treino ativo. Capturas web em `test-results/treino-observacoes-20261013.png` e `test-results/treino-observacoes-modal-20261013.png`.

No Android, conferidos observação e lápis acima das séries, modal, teclado com Salvar/Cancelar acessíveis, cancelamento de um rascunho, fechamento pelo Voltar, salvamento e retomada após encerrar o processo. Foi mantido o texto “Barra W” do exercício fictício, sem registrar novas séries/sessões. Capturas em `test-results/pixel-note-modal-20261013/`; deixado o treino aberto no Supino reto. Sem teste em aparelho físico.

APK daquela entrega: `../entrega/ritmo-android-20261013-f8a6eee6.apk`, **49.485.312 bytes**, SHA-256 `f8a6eee6895551aa0cd6a332c4839cfb5b80169d3bfa1c516f2257169efe6dd9`, certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`. O build 10 foi arquivado em `../entrega/ritmo-android-20261013-0bb8b5f7.apk`.

## Impedimentos, observações e sugestões automáticas — build 10, 13/10/2026

Generalizado o rótulo Cãibra para **Impedimento**, incluindo cansaço e outras dificuldades; adicionado **Impedimento externo** independente para tempo/equipamento e outras situações externas. Se qualquer uma das duas sessões comparadas tiver impedimento externo, ambas as sugestões automáticas ficam bloqueadas. Mantidos os campos antigos e acrescentados campos opcionais, sem limpar dados de versões anteriores.

Sugestões do app usam um único triângulo: verde para aumentar e vermelho para diminuir. A redução exige, em cada um dos dois últimos treinos, mais da metade das séries concluídas/válidas abaixo de metade da meta (denominador = todas as séries). Metas e quantidade de séries precisam ser iguais; pendentes não contam como falha, igualdade com metade não conta, e as cargas podem variar entre as sessões. Lembretes manuais continuam com dois triângulos. Nenhuma carga é alterada automaticamente.

Observações livres por exercício (até 300 caracteres) disponíveis no editor de rotina/divisão, consulta, execução e histórico. Editar durante o treino atualiza explicitamente a observação da sessão e do planejamento correspondente, para os próximos treinos; os registros antigos permanecem intactos. O importador também aceita `nota` opcional em cada exercício.

Validação atual: TypeScript, **62 testes Node**, **29 fluxos Playwright**, exportação web e Prettier dos arquivos alterados aprovados. Conferidos visualmente o triângulo de redução e as observações em viewport de celular. APK release ARM64/x86_64 compilado, pacote/versão e assinatura verificados. Atualização do build 9 para o 10 com `adb install -r` no **Pixel_7_2** (`emulator-5554`) preservou exatamente o JSON anterior, com uma rotina, 14 sessões e treino ativo. No Android foram conferidos a sugestão verde com triângulo único, Impedimento, botão de Impedimento externo, modal/Voltar e observação livre retomada após encerrar o processo. Foi acrescentado apenas “Barra W” ao exercício fictício Supino reto, na sessão e no planejamento, para demonstrar o novo campo; histórico preservado. Capturas em `test-results/pixel-impedimentos-20261013/`, `test-results/treino-reducao-automatica-20261013.png` e `test-results/treino-observacoes-20261013.png`. A redução automática foi exercitada no domínio e na web, sem simular novas sessões no emulador do usuário. Sem teste em aparelho físico.

APK daquela entrega: `../entrega/ritmo-android-20261013-0bb8b5f7.apk`, **49.483.388 bytes**, SHA-256 `0bb8b5f7cd8aee6a693383695796817956c0031f7581a08c1f3f649321839404`, certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`. O build 9 foi arquivado em `../entrega/ritmo-android-20261013-0120178f.apk`.

## Ícones por exercício e APK build 9 — 13/10/2026

O botão que abre o gráfico agora usa gráfico de barras. Os lembretes do último treino aparecem uma única vez no cabeçalho do exercício, acima das séries: dois triângulos verdes para cima (aumentar), dois amarelos para baixo (diminuir), igual azul (manter) e triângulo vermelho com exclamação (cãibra). Os mesmos símbolos aparecem nos controles e no detalhe histórico, com nomes acessíveis. Não há alteração do modelo persistido.

Validação: TypeScript, **59 testes Node**, **27 fluxos Playwright**, exportação web, inspeção visual em tamanho de celular e Prettier nos arquivos alterados aprovados. APK release 1.0.5/build 9 compilado para ARM64/x86_64, assinatura conferida e atualização do build 8 feita com `adb install -r` no **Pixel_7_2** (Pixel 7 (2), `emulator-5554`). Uma cópia local do banco foi preservada antes da atualização; a leitura posterior confirmou exatamente o mesmo JSON, com uma rotina, 14 sessões e treino ativo. Os dados de teste não foram recriados ou substituídos. Capturas Android em `test-results/pixel-icons-20261013/`.

APK daquela entrega: `../entrega/ritmo-android-20261013-0120178f.apk`, **49.477.296 bytes**, SHA-256 `0120178f7bfe19507e369a3457160fbe48c27f36a58f8577a859016fbdb3a2b1`, certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`. O build 8 foi arquivado em `../entrega/ritmo-android-20261013-8aa17b27.apk`.

## APK build 8 e prévia no Pixel 7 (2) — 13/10/2026

Gerado APK release 1.0.5/build 8 com prebuild Expo e `scripts/build-release.ps1`, para ARM64 e x86_64. `aapt` confirmou pacote/versão e `apksigner` confirmou o mesmo certificado das entregas anteriores. O manifesto final contém os serviços de descanso/cardio e `allowBackup=false`.

Instalado com `adb install -r` no AVD **Pixel_7_2**, nome exibido **Pixel 7 (2)**, serial `emulator-5554`; esse AVD ainda não tinha o Ritmo instalado. A pedido do usuário, foram acrescentados somente nesse emulador uma rotina genérica com quatro exercícios e **14 sessões fictícias de 30/09 a 13/10/2026**, com variações de carga/repetições, peso corporal, uma sessão parcial e exemplos dos lembretes. O banco anterior foi copiado antes da inserção e o JSON final foi validado e relido. Os dados de demonstração não integram o APK nem o banco padrão do app.

Validação Android atual: abertura do APK release, comparação de séries, indicação de progressão, modal do gráfico, fechamento pelo Voltar e tags de aumentar/manter/diminuir carga e cãibra conferidos. Capturas e scripts descartáveis em `test-results/pixel-preview-20261013/`. Deixado um treino da rotina genérica em andamento, com 0/12 séries, na tela de Supino reto para a consulta do usuário. O AVD permaneceu aberto. Não houve teste em aparelho físico nem repetição dos ensaios de áudio em segundo plano nesta etapa.

APK daquela entrega: `../entrega/ritmo-android-20261013-8aa17b27.apk`, **49.476.368 bytes**, SHA-256 `8aa17b27285681cea421b79b208096b91d20b6096c0fa6471e03b90638735768`, certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`. O build 7 anterior foi preservado em `../entrega/ritmo-android-20261013-2a6ac773.apk`.

## Execução, comparação de séries e lembretes — 13/10/2026

O exercício atual passou a ser o foco da execução, com progresso compacto e gráfico em modal pelo botão de expansão. Cada série mostra repetições e carga do último treino ao lado da meta. Os botões abaixo de Anterior/Próximo registram aumentar/manter/diminuir carga e cãibra por exercício; os lembretes persistem ao retomar, aparecem no histórico e viram tags sob a carga na próxima sessão. Os campos são opcionais e compatíveis com bancos/backups v1 anteriores.

A indicação de progressão usa os dois últimos treinos da mesma rotina: todas as séries correspondentes concluídas, mesmas metas, repetições maiores ou iguais às metas e pesos repetidos por posição. Manter/diminuir/cãibra no último treino suprimem o aviso. Nenhuma carga é ajustada automaticamente.

Validação atual: TypeScript, **59 testes Node**, **27 fluxos Playwright**, exportação web e Prettier nos arquivos desta alteração aprovados. A suíte web final usou o mesmo bundle e os mesmos testes, com servidor iniciado separadamente e configuração temporária sem gerenciamento de `webServer`, pois o encerramento automático do servidor travou no Windows. `format:check` na raiz encontrou `EPERM` ao enumerar `.tools/signing`; a conferência explícita dos arquivos alterados passou sem acessar essa pasta. Inspeção visual em 390×844 confirmou alinhamento dos campos, controles selecionados e modal dentro da tela. Capturas em `test-results/treino-lembretes-20261013.png`, `treino-modificadores-20261013.png`, `treino-progressao-20261013.png` e `treino-grafico-modal-20261013.png`. Não houve novo APK, instalação ou teste em Android nesta etapa.

## Esforço relativo e janela dos gráficos — 05/10/2026

A aba Gráficos passou a abrir com peso corporal e esforço relativo por data. O esforço é o volume de séries concluídas dividido pelo maior volume da mesma rotina e fase de planejamento; 1.000/1.500 aparece como 66%. A fase muda ao alterar exercícios ou metas, conforme esclarecimento do usuário; nome e descanso não a alteram. IDs distintos mantêm treinos homônimos separados. Cores e rótulos identificam as fases no gráfico, nos cartões do Histórico e no detalhe. O período comum aos dois gráficos oferece 30 dias, 90 dias por padrão, 1 ano e todo o histórico, sem mudar a referência máxima. Nada foi migrado ou regravado no banco.

Validação desta etapa: `npm.cmd run typecheck`, **56 testes Node**, **25 fluxos Playwright** e `npm.cmd run format:check` aprovados. O gráfico e os cartões do Histórico foram inspecionados em viewport de celular com treinos A homônimos e fases diferentes; capturas em `test-results/grafico-esforco.png` e `test-results/historico-esforco-cores.png`. Não foi gerado novo APK para esta etapa.

## Correções de cardio, descanso e gráficos — 05/10/2026

O código passou a agendar os bipes de troca de velocidade do cardio em um serviço Android próprio, ativo após sair do painel ou apagar a tela. Pausar e encerrar cancelam a agenda. O aviso de descanso durante outro exercício ganhou **Voltar ao exercício**. A aba Gráficos exibe o peso corporal por data antes da seleção de exercícios. O gráfico de esforço relativo foi definido e implementado na etapa posterior registrada acima.

Validação desta alteração: `npm.cmd run typecheck`, **53 testes Node** e **24 fluxos Playwright** aprovados. `:ritmo-rest:compileDebugKotlin` e `:app:assembleDebug` aprovados. O APK debug foi instalado em um AVD dedicado, com dados fictícios: o log `RitmoCardioCue` registrou o aviso em segundo plano, ausência de aviso após pausar antes da troca e novo aviso após retomar com `mWakefulness=Asleep` e `mScreenState=OFF`. A interface alterada foi verificada no viewport de celular do Playwright. O AVD e o Metro iniciados para esse teste foram encerrados.

O APK gerado nesta validação é **debug**, em `android/app/build/outputs/apk/debug/app-debug.apk`. Não foi gerado nem instalado novo APK de distribuição; a versão release 1.0.5/build 7 descrita abaixo não inclui estas correções. A audibilidade e a redução de volume de outro app não foram testadas em telefone físico.

## Revisão documental e preparação dos commits — 04/10/2026

As mudanças acumuladas desde `cc236fb` foram revisadas e organizadas por assunto: widget de treinos, widget de suplementos, versão 1.0.5/build 7 e documentação compartilhada. Os guias de uso, fundamentos e módulos agora explicam as faixas compactas, o cartão vertical, o conteúdo oculto em 1×1 e o redimensionamento pelo launcher. O banco e as regras de lembretes permanecem iguais; sequências de suplementos continuam na aba do app.

Verificações executadas nesta revisão: TypeScript aprovado; **52 testes Node** aprovados; **14 testes JVM** reexecutados e aprovados (6 de estado do widget de treinos, 4 de agenda de lembretes e 4 de estado do widget de suplementos); formatação e links locais conferidos. Os metadados de versão em `app.json`, `package.json` e `package-lock.json` são consistentes. A inspeção do conteúdo candidato ao Git não encontrou arquivos privados/gerados nem os padrões de credenciais pesquisados; isso não é uma auditoria integral de segurança.

O APK existente foi identificado com `aapt` como 1.0.5/build 7 e seu SHA-256 foi reconferido, coincidindo com a entrega abaixo. Não houve nova compilação release, instalação, teste em aparelho/emulador, Playwright, Expo Doctor ou consulta de dependências nesta revisão. As evidências nativas e web das entregas anteriores continuam identificadas nas suas seções.

Os commits desta preparação são locais, na branch `master`; o remoto `origin` aponta para `https://github.com/EduardoPortoSilva/ritmo-app.git`. Esta tarefa não inclui push.

## Widgets 1×2 — 04/10/2026

Os widgets de treinos e suplementos agora podem ser reduzidos horizontalmente até uma célula e aumentados verticalmente para duas. Em 1×2, o Android seleciona um layout vertical com marca, contagem e resumo curto; o treino mantém o ponto de estado, e suplementos mostram o primeiro pendente com `+N` separado. Em 1×1, o resumo é ocultado para evitar corte. As faixas 3×1/4×1 e os destinos de toque permanecem. `minResizeWidth=48dp`, `maxResizeHeight=260dp` e `resizeMode=horizontal|vertical` permitem a mudança, sujeita à grade do launcher.

Validação da entrega: testes JVM de ambos os módulos e Gradle release aprovados. No AVD isolado `RitmoCompactQA`, ambos foram redimensionados de fato para 1×2 e fotografados; foram conferidos descanso, contagem, suplemento pendente, `+N`, fonte a 140% e abertura do app/aba Suplementos pelo toque. O `dumpsys appwidget` confirmou `resizeMode=3` para os dois. Não houve teste em celular físico nem repetição da suíte web, pois esta mudança é nativa. O AVD `Pixel_7` foi atualizado do build 6 para o 7 com `adb install -r` e o app abriu normalmente.

APK daquela entrega: `../entrega/ritmo-android-20261013-2a6ac773.apk`, versão 1.0.5, `versionCode` 7, 49.438.908 bytes, SHA-256 `2a6ac773a4c00452ff76c6fb4b1ffb8b180bb5f883a41cf4a19d6868f7d27e94`, certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`. O build 6 anterior foi arquivado em `../entrega/ritmo-android-20261004-1b7ca9af.apk`.

## Versão 1.0.5 — 03/10/2026

A versão exibida mudou de 1.0.0 para 1.0.5 em `app.json`, `package.json` e `package-lock.json`. O Android `versionCode` subiu de 5 para 6 para atualizar a instalação anterior; não houve alteração de funcionalidade nem formato de dados nesta mudança. Prebuild e Gradle release concluíram. O APK foi verificado com `aapt` e `apksigner`: `versionName=1.0.5`, `versionCode=6`, certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`. A instalação no AVD `Pixel_7` atualizou a versão 5 para a 6 sem desinstalar o aplicativo. O APK anterior foi arquivado.

APK histórico build 6: `../entrega/ritmo-android-20261004-1b7ca9af.apk`, 49.436.835 bytes, SHA-256 `1b7ca9af13b2483cc2034f090e59da72e05b4b6e881dd362f5c7f1d2ed966426`. Esse era o hash de `SHA256SUMS.txt` naquela entrega.

## Widgets compactos — 03/10/2026

Os widgets Android de treinos e suplementos adotaram a proposta 01 · Faixas compactas. Cada um abre em 4×1, pode ser reduzido horizontalmente para 3×1 e mostra cabeçalho, contagem e resumo em duas linhas. O treino usa um ponto pequeno para pendência, conclusão ou descanso; suplementos priorizam os pendentes. Nomes longos são truncados e `+N` fica em campo independente. Foram removidos da faixa a data, as carinhas grandes, rodapés e sequências de suplementos. O toque continua abrindo o app ou a aba Suplementos, respectivamente. A migração do banco não foi necessária.

Validação: TypeScript, 52 testes Node, 23 fluxos Playwright, testes JVM dos dois módulos e Gradle release aprovados. Em AVD isolado `RitmoCompactQA`, com dados fictícios, foram inspecionados estados vazios, parciais e concluídos, nomes longos, múltiplas pendências, fonte 140%, largura 3×1/4×1 e os dois destinos de toque. O APK final foi instalado nesse AVD; `dumpsys appwidget` confirmou `resizeMode=1` (somente horizontal) para ambos. O launcher preservou a altura ampliada manualmente de uma instância existente após a atualização; para obter a nova geometria padrão, remova e fixe novamente esse widget. Não houve teste em telefone físico.

APK histórico v5: `../entrega/ritmo-android-20261003-cb372d90.apk`, 49.436.835 bytes, SHA-256 `cb372d906e4a9b5f533848b119dc908ce11acbfb8282a476605082a31316b1f1`, `versionCode` 5, certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`. O APK v4 anterior foi preservado em `../entrega/ritmo-android-20261003-d3dbfa00.apk` e `SHA256SUMS.txt` foi atualizado.

## Preparação para o GitHub — 02/10/2026

A documentação compartilhada passou a ficar em `docs/`, dentro da raiz Git. Foram acrescentados README, guia de uso, dados, contribuição, segurança e envio ao GitHub. As instruções e o teste do catálogo importável passaram a usar os caminhos versionados, permitindo um clone sem `.codex/` local.

A revisão inicial desta preparação encontrou 51 de 52 testes aprovados: o caso restante lia o caminho antigo `.codex/IMPORTACAO.md`, já ausente. A referência foi corrigida para `docs/IMPORTACAO.md`. Validação atual desta preparação: TypeScript aprovado, **52 testes Node aprovados**, links Markdown locais conferidos sem destinos ausentes e formatação Prettier aprovada após ajustar três arquivos existentes do módulo de descanso. Também foram conferidas as exclusões de chave/credenciais, backups pessoais, dependências instaladas e artefatos gerados. Não foram repetidos Playwright, Expo Doctor, audit de dependências ou testes nativos nesta tarefa documental.

Nenhum novo APK foi compilado ou instalado nesta tarefa de documentação. O banco, as funcionalidades e a assinatura não foram alterados. Nenhum repositório remoto foi configurado; o destino GitHub será definido posteriormente.

## Aviso de descanso — evidência histórica de 02/10/2026

A entrega de código de 02/10/2026 acrescentou o serviço nativo de aviso de descanso em segundo plano. Naquela entrega, passaram TypeScript, 52 testes Node, 23 fluxos Playwright e Gradle release. Em AVD isolado, foram conferidos início/conclusão ao abrir outro app, pausa/cancelamento, retomada e contagem com tela apagada. Não houve teste audível com música de outro app em telefone físico.

APK histórico, mantido localmente fora do Git:

| Campo                         | Referência                                                         |
| ----------------------------- | ------------------------------------------------------------------ |
| Arquivo no workspace original | `../entrega/ritmo-android-20261003-d3dbfa00.apk`                   |
| Tamanho                       | 49.435.902 bytes                                                   |
| SHA-256                       | `d3dbfa009d52b59d2de4b0658ae9ec42d306f31a5ae96305a2775c7e62b58cf9` |
| Certificado SHA-256           | `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070` |
| Versão Android                | `versionCode` 4                                                    |

Esses hashes identificam aquela entrega e não são o resultado de uma recompilação nesta tarefa. A documentação/evidências detalhadas do workspace original ficam em `../.codex/`, `test-results/` e `.tools/`, que não acompanham automaticamente um clone.

A reauditoria local posterior do APK v4, também em 02/10/2026, não identificou regressão das correções de backup, restauração, limites ou assinatura dentro do escopo revisto. Ela executou TypeScript, 52 testes Node e quatro fluxos Playwright selecionados, além de inspeções de artefato/dados. Não repetiu instalação/testes nativos.

## Limitações e pendências

- Sem conta, backend, sincronização automática ou backup remoto próprio; Android e web guardam dados independentes.
- Backup exportado é legível. Sem cópia manual, desinstalar pode perder os dados. Banco único limitado a 1.500.000 bytes UTF-8 para escrita/restauração.
- iOS não validado; não há comprovação de testes em celular físico para esta entrega.
- Widgets/lembretes podem atrasar em economia de bateria ou após forçar parada. Avisos nativos de cardio e descanso são transitórios e não retornam após forçar parada ou reiniciar o aparelho; web/Expo Go dependem do painel/JavaScript.
- A revisão v4 registrou caminho possível de aviso perdido caso `startForeground()` falhe internamente; a ponte pode já ter informado sucesso ao JavaScript. Não foi reproduzido naquela revisão.
- O Expo Doctor histórico passou 20/21 checks, pedindo `expo~57.0.26` enquanto o lock estava em 57.0.23. Dependências não foram atualizadas nesta preparação.
- A auditoria histórica registrou advisories transitivos de `node-forge`/`uuid` nas ferramentas Expo. Reconsultar e analisar antes de uma distribuição; nenhuma correção automática foi aplicada aqui.
- Build EAS de nuvem não validado como equivalente ao release local; credenciais precisam de configuração própria e a CLI do comando não tem versão fixa.
- A rotina de exemplo criada nos dados de teste continua com remoção adiada pelo usuário; veja [TODO](../TODO.md). Ela não é conteúdo padrão do código/APK.

## Manter este registro

Ao entregar uma mudança, registre o que realmente foi executado, resultado e limitações. Se houver novo APK, inclua versão, hash, assinatura e onde foi testado. Preserve a distinção entre código, bundle JavaScript e APK instalado.
