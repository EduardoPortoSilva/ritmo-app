# Estado e validação

Referência: **28/10/2026**. O código continua sendo a fonte de verdade. Resultados históricos pertencem à entrega mencionada e não substituem testes de uma alteração futura.

## Código atual

Aplicativo `com.ritmo.treinos`, versão **1.0.5**, Android `versionCode` **23**. Base instalada registrada no lockfile: Expo **57.0.30**, React Native **0.86.3**, React **19.2.3**. Android é a plataforma principal; web facilita desenvolvimento/testes; iOS não foi validado.

Implementados: força com divisões/conjuntos e pausa do planejamento, programação semanal, séries e descansos individuais, retomada de sessão, histórico e gráficos, peso corporal, vínculos/mapa muscular, cardio por etapas com distância, suplementos diários, widgets/lembretes Android, importação `ritmo/1` e backup completo `ritmo-backup/1`.

## Organização dos commits e conferência — 28/10/2026

As mudanças acumuladas foram organizadas em 13 commits: ferramentas Android, teclado, gráfico de peso, motor de fórmulas, substâncias/blends, calorias/peso corporal, fórmulas em lote, detalhes das séries, execução do treino, vínculos de suplementos, doses/histórico, inversões de ordem e documentação/entrega. As etapas intermediárias de código passaram por TypeScript e testes Node. Comparação SHA-256 confirmou que os 82 arquivos não Markdown envolvidos mantiveram exatamente o conteúdo anterior à organização; a documentação teve referências atualizadas e seções repetidas consolidadas.

Conferência atual: TypeScript, **131 testes Node**, exportação web, formatação e links locais aprovados. Na suíte completa de **96 fluxos Playwright**, **95 passaram** e o cenário de reposicionamento do campo de descanso no editor falhou na verificação da margem inferior após reduzir o viewport para 390 × 430. Repetir os quatro cenários de teclado três vezes resultou em **11 aprovações e 1 falha** no mesmo cenário, indicando intermitência. A captura manteve o campo focado e visível próximo à borda; o critério de folga não foi atendido. Causa ainda não confirmada, sem mudança funcional para mascarar o resultado. Evidências em `.tools/commits-20261028/`, incluindo `playwright.log`, `keyboard-repeat.log`, `keyboard-failure/` e verificações intermediárias.

Esta tarefa não gerou nem instalou outro APK e não alterou dados de emuladores. O build 23 abaixo continua sendo a entrega Android de referência; a falha intermitente observada agora é do ensaio web com viewport reduzido, sem novo teste de IME Android.

## APK de entrega 1.0.5/build 23 — 27/10/2026

Gerado após pedido de compilação, com incremento de `versionCode` para 23, prebuild Android e release aprovado em **3 min 46 s**. Arquivo `android/app/build/outputs/apk/release/app-release.apk` copiado e conferido em `../entrega/ritmo-1.0.5-build23.apk`, com hash ao lado em `.apk.sha256`. **50.420.052 bytes**, SHA-256 **`e8fb5a6b48d33aee4d32440af72374be276d67551ac8e4056db2564beec59ed0`**. A cópia e o original correspondem.

Assinatura release existente verificada (certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`); pacote, versão e `allowBackup=false` conferidos no APK. As **67 fontes próprias** do mapa do bundle correspondem ao código atual, incluindo o histórico de doses. Nenhuma alteração funcional nesta entrega; o ensaio Android de 50 dias abaixo foi feito no build 22 com esse mesmo código de aplicação. **Build 23 não foi instalado nesta tarefa**, sem novo ensaio nativo ou repetição da suíte de testes. Evidências em `.tools/apk-20261027/`: `prebuild-23.log`, `build-release-23.log`, `verification.json`, `delivery.json` e scripts de conferência. O alias antigo `../entrega/ritmo-android.apk` não foi substituído.

## Teste Android de Creatina com 50 dias retroativos — 27/10/2026

APK release atual compilado em **2 min 7 s** e instalado por atualização somente no AVD sintético **Ritmo_Build16_QA**, Android 15/API 35, `emulator-5566`, fuso GMT. Versão **1.0.5/build 22** mantida, **50.420.052 bytes**, SHA-256 **`4ad1acb0fbd73fc6b1aef4797349fa85743a93e7383f5bdaaca0bd3be657b940`**. Hash instalado correspondeu ao compilado e as **67 fontes próprias** do mapa do bundle corresponderam ao código atual. Pixel e cópias em `../entrega/` não foram alterados.

Suplemento **Creatina** criado pela interface; 50 dias antigos, **07/09 a 26/10/2026**, preparados como fixture local no banco do AVD QA, sem horários e sem vínculos, preservando os demais registros sintéticos. Só depois foi cadastrada pela interface **Creatina monohidratada**, inicialmente sem doses e com projeção zero. O modelo é explicitamente fictício, sem validade fisiológica: soma de contribuições `d * (1 - exp(-ln(2)*t/a)) * exp(-ln(2)*t/h)`, dose de teste **1 ut**, `a=72 h`, `h=720 h`, janela de 720 h. Serve para testar acúmulo lento, não representa farmacocinética ou efeito da creatina real.

Vínculo, hora média **08:00**, prévia e importação executados na interface nativa. A prévia indicou **50 novas / 0 existentes / 0 futuras**, sem escrever doses antes de confirmar. Depois, banco e UI confirmaram **50 ingestões**, todas nos dias originais às 08:00, com origem de suplemento e horário estimado; `takenAt` permaneceu ausente. A projeção passou de **0** para **≈25,9 ut** (`25,92718678731096` no instante conferido); cálculo independente com potências de 2 coincidiu, diferença zero. Nova conferência indicou **0 novas / 50 existentes**, sem duplicação. Clique real em Tomei hoje criou a 51ª ingestão, com timestamp exato em `takenAt` e origem não estimada; desfazer restaurou integralmente o banco com as 50 doses e todos os demais dados de QA preservados.

Evidências e roteiro em `.tools/creatina-qa-20261027/`, incluindo `results.json`, `future-click.json`, `apk-verification.json`, snapshots do banco, dumps e capturas. Prints finais em `test-results/creatina-50-dias-avd.png` e `creatina-50-dias-sem-duplicar-avd.png`. Nenhuma alteração no código do app foi necessária neste ensaio. Os 50 dias foram simulados como fixture histórica, não por cinquenta cliques diários nem por mudança do relógio. O roteiro precisou usar Voltar nativo após a lista de 50 ingestões; a busca inicial do botão fora da área visível foi uma limitação do roteiro. Sem teste em aparelho físico ou validação fisiológica.

## Doses de substância pelo suplemento e vínculo retroativo — código de 27/10/2026

O editor permite configurar doses de substâncias em **Dose ao tomar o suplemento**. Novos cliques em **Tomei hoje** salvam o instante da confirmação e criam as doses nesse horário, uma vez por dia, com origem identificada. Desfazer remove somente doses daquela confirmação, mantendo avulsas e blends. Salvar vínculos ou doses novas não modifica ingestões anteriores. A direção substância/blend → suplemento existente foi preservada, sem criar doses em cadeia.

**Aproveitar o histórico** pede a hora média para dias antigos sem horário, usa horários de confirmação já salvos quando disponíveis e abre uma prévia antes de salvar vínculo e ingestões juntos. A prévia usa dose e modelo atuais, ignora dias com ingestão já existente da substância e horários futuros, e permite restringir por data inicial sem truncar dados ao atingir 200 ingestões. Datas diárias antigas não recebem timestamps fictícios; as doses importadas registram quando o horário é estimado. Campos opcionais `Supplement.substanceDoses`, `takenAt` e `SubstanceDose.supplement` são validados e preservados nos backups, mantendo banco v1.

Validação executada: TypeScript, **131 testes Node**, **96 fluxos Playwright** completos, formatação dos arquivos alterados e `git diff --check` aprovados. Oito testes de domínio e quatro fluxos novos cobrem horário exato do clique, dose configurada/edição, histórico médio/real, prévia sem escrita e aplicação explícita, desfazer, duplicatas, campos inválidos, falhas atômicas, prévia desatualizada, limites, residuais acumulados e backups legados. Capturas fictícias inspecionadas em 320/390 px: `test-results/suplemento-previa-historico-*.png`. **Sem APK novo, instalação ou alteração dos registros do usuário nesta tarefa**; o APK de 22/10 abaixo ainda não contém esta implementação.

Bundle Android/Hermes exportado com sucesso em `.tools/supplement-doses-20261027/android-bundle/` (847 módulos). A exportação JavaScript não gera um APK.

## APK instalado no Pixel 7 (2) — 22/10/2026, após os avisos de ordem

Release compilado em 51 s e instalado por atualização (`adb install -r`) no AVD solicitado **Pixel_7_2**, `emulator-5554`, iniciado nesta tarefa. O app foi aberto com `Status: ok` e confirmado como atividade em primeiro plano, inclusive após reiniciar o AVD com áudio habilitado. Sem limpeza/desinstalação, alteração de assinatura ou mudanças nos registros para testar as funcionalidades.

APK atual: `android/app/build/outputs/apk/release/app-release.apk`, **50.400.924 bytes**, versão **1.0.5/build 22** mantida. SHA-256 **`e8aef4d600d63a6d0776eaeee34b9e5435a02bc762e76e3dc5147a8bab7a7ca3`**. Hash do APK instalado corresponde ao compilado, reconferido após o reinício. Certificado SHA-256 existente `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`. As **63 fontes próprias** do mapa de fontes do bundle corresponderam ao código atual, incluindo teclado, card da série atual, cabeçalho flutuante e detector/símbolos de inversão da ordem.

Evidências locais em `.tools/pixel-order-20261022/`: `build-install.log`, `bundle-verification.json` e roteiro de conferência. O AVD e o app ficaram abertos para o usuário testar. As cópias em `../entrega/` não foram substituídas. Esta entrega supersede o APK de teclado identificado abaixo; os resultados de 123 testes Node e 92 fluxos web continuam sendo a validação do código, sem novo ensaio completo das funcionalidades no Android com dados reais.

## Mudança na ordem dos exercícios — código de 22/10/2026

Implementada confirmação por par quando a primeira série de A é concluída depois de todas as séries de B, sendo A anterior a B no cadastro da sessão. Campos preenchidos sem conclusão não disparam a regra. Cada par tem resposta independente e persistida, inclusive pergunta pendente após recarregar o app; recusar não gera alerta. A próxima sessão copia as trocas confirmadas do último treino da mesma rotina e avisa na primeira consulta de cada exercício envolvido. Fechar o aviso é lembrado na sessão. Símbolos amarelos de dois retornos em U opostos, em desenho retangular, aparecem junto aos indicadores de carga, um por par; vários ficam lado a lado e cada botão reabre somente sua troca. Disponíveis também no treino atual e no detalhe histórico.

Novos campos opcionais `Workout.orderChecks`, `previousOrder` e `orderNoticesSeen`, validados no parser e preservados nos backups; bancos v1 antigos continuam aceitos. Cadastro, registros anteriores, cargas e regras de sugestão não são reescritos. Não há inferência retroativa da ordem de treinos antigos; o aviso usa a última sessão e não procura outra mais antiga se a última não teve troca.

Validação: TypeScript, **123 testes Node**, **92 fluxos Playwright** completos, mais repetição dos quatro fluxos novos após desativar animações nas capturas. Cobertos detecção/recusa/retomada, vários pares e respostas independentes, primeira série e B parcial, referências por ID, filtros/avanço automático, aviso por exercício, consulta manual sem mutação, parser/backups e compatibilidade legada. Capturas fictícias inspecionadas em 320/390 px: `test-results/ordem-confirmacao-320.png`, `ordem-proximo-treino-320.png`, `ordem-simbolos-*.png`. **Sem novo APK ou ensaio nativo nesta alteração**; o APK de teclado abaixo é anterior à detecção de ordem.

Bundle JavaScript Android/Hermes exportado com sucesso em `.tools/order-20261022/android-bundle/`, sem novas dependências ou permissões. Exportar esse bundle não recompila o APK.

## Cabeçalho flutuante do treino — código de 22/10/2026

Voltar, nome, filtro de concluídos, contagem e barra verde permanecem fixos acima da área rolável. A contagem inclui porcentagem do treino inteiro com duas casas e ponto decimal, como `1/6 séries · 16.67%`. O cabeçalho ocupa espaço próprio e não cobre campos; o card da série atual continua abaixo da barra, na área rolável. Sem alteração de banco ou dependências.

Validação: TypeScript, **116 testes Node**, **88 fluxos Playwright** completos, formatação e `git diff --check` aprovados. Conferência visual em 320/390 px; novo fluxo cobre cabeçalho imóvel ao rolar até o final, filtro funcional, retorno à linha sem sobreposição e preservação dos dados. Percentuais zero, fracionários e completo conferidos. Capturas fictícias em `test-results/top-bar-treino-flutuante-*.png`. **Sem novo APK ou ensaio nativo**; o APK de teclado abaixo continua anterior a este cabeçalho e ao card da série atual.

## Card permanente da série atual — código de 22/10/2026

O card compacto aparece sempre durante o treino, com ou sem descanso e ao consultar outro exercício. `currentWorkoutSet` escolhe a primeira série não concluída na ordem da sessão, sem pular lacunas. Ao concluir o exercício, a referência passa ao próximo com pendência; desmarcar uma série reabre essa referência. O botão com seta de retorno em U (`arrow-u-left-top`) abre o exercício e rola até a linha exata, inclusive na mesma página. O filtro de exercícios concluídos é preservado. O cronômetro/pausa continuam no card enquanto houver tempo de descanso, controlando sua série de origem, e não determinam o destino do retorno. Ao terminar tudo, o card permanece com **Séries concluídas**. Sem alterações no banco, dependências ou módulos nativos.

Validação desta alteração: TypeScript, **116 testes Node**, **87 fluxos Playwright** completos, formatação e `git diff --check` aprovados. Cobertos referência antes/durante/depois do descanso, pausa/retomada, conclusão fora de ordem, avanço de exercício, filtro, desmarcação, fim do treino e rolagem até a décima série na mesma página e em outra. Conferência visual em **320 e 390 px**, mantendo o card com até 64 px e alvos de toque de 44 px. Capturas fictícias `test-results/serie-atual-sem-descanso-*.png` e `serie-atual-compacto-20261022-*.png`. Bundle Android/Hermes exportado em `.tools/current-set-20261022/android-bundle/`. **Sem recompilação de APK nem novo ensaio nativo nesta alteração**; o APK de teclado abaixo é anterior a este card.

## Teclado e rolagem dos formulários — 22/10/2026

Implementados `KeyboardScrollView` e `KeyboardTextInput`, usados nos formulários de rotinas/divisões, séries, cardio, suplementos, perfil, importação, fórmulas e substâncias. Foco, abertura do teclado e mudanças de layout reposicionam o campo com margem para leitura; o usuário pode rolar manualmente sem recolher o teclado. Campos multiline limitam a altura à área útil e mantêm rolagem interna, incluindo JSON grande. Janela principal e modais de edição usam `KeyboardAvoidingView` (`height` Android, `padding` iOS). A reserva inferior permanece até o teclado recolher, evitando deslocar Salvar durante o toque. Sem novas dependências, permissões ou alteração do banco.

Validação: TypeScript, **113 testes Node**, **84 fluxos Playwright** completos, formatação dos arquivos alterados e `git diff --check` aprovados. Os quatro novos fluxos web simulam área útil reduzida em **320 e 390 px**; isso não equivale a um IME nativo. Capturas em `test-results/teclado-web-*.png`.

APK release compilado e instalado por atualização somente no AVD sintético **Ritmo_Build16_QA**, Android 15/API 35, `emulator-5566`, 1080×2400/densidade 420. Com teclado virtual real, descanso e carga ficaram inteiros acima do teclado, com margens de 53/52 px; a carga passou de `[527,1642][806,1763]` para `[527,1460][806,1581]`, com teclado começando em y=1633. Rolagem manual manteve o IME aberto. O campo de referência no modal também ficou acima do teclado; salvar no primeiro toque fechou o modal e cadastrou o modelo de teste. O valor de carga alterado no treino fictício anterior foi restaurado para 0. Dados e registros novos do ensaio são exclusivamente sintéticos; Pixel não foi aberto/alterado. Sem teste em telefone físico, iOS ou outra versão Android.

Saída atual `android/app/build/outputs/apk/release/app-release.apk`: **50.387.108 bytes**, SHA-256 `f3b1446bb0013968dbc293eb352193bfa5989dbd0b1f9f3e93c518d5a36aa7d4`, versão **1.0.5/build 22** mantida. Assinatura existente verificada; hash do APK instalado no AVD correspondeu ao compilado e as **59 fontes próprias** do mapa do bundle corresponderam aos arquivos atuais. As cópias em `../entrega/` não foram substituídas. Evidências, dumps, roteiros e logs em `.tools/keyboard-20261022/`, incluindo `native-results.json`, `bundle-install.json`, `build-release-final.log` e `android-*.png`. O servidor web e o emulador do ensaio foram encerrados ao final.

A primeira tentativa web revelou perda do clique em Salvar ao mudar layout por blur; corrigida e repetida com sucesso. Ajustes posteriores do roteiro nativo priorizaram o campo por descrição acessível (em vez do texto do rótulo), respeitaram o treino fictício já ativo e verificaram fechamento do modal/modelo salvo mesmo com o botão de ingestão fora da área visível. Essas falhas de roteiro não foram classificadas como falhas do app.

## Peso mais recente e aviso de atualização — código de 20/10/2026

Novos treinos escolhem o peso válido de data mais recente entre o perfil e todas as sessões finalizadas, sem prioridade fixa para o perfil. O editor de dados e o prompt de importação usam a mesma escolha; histórico e treino já iniciado mantêm suas cópias. O campo opcional `BodyProfile.weightRecordedAt` registra cadastro/confirmação de peso e entra no backup, sem mudar a versão/chave. Perfis anteriores sem data continuam válidos e ficam atrás de históricos datados.

Logo abaixo do destaque principal do início há um aviso quando a última pesagem tem mais de sete dias, com **Atualizar peso** e retorno ao início. Exatamente sete dias não ativa o aviso; ele é reavaliado com o app aberto e ao retornar ao primeiro plano. O editor permite confirmar o mesmo peso para hoje; editar só altura ou salvar sem confirmar não renova a data. Peso legado sem data pede confirmação; nenhum peso cadastrado não gera aviso de registro antigo.

Validação desta alteração: TypeScript, **109 testes Node**, **80 fluxos Playwright** completos, formatação dos arquivos alterados, `git diff --check` e exportações web/Android/Hermes aprovados. Cobertos recência nos dois sentidos, limite de sete dias, confirmação com mesmo valor, data desconhecida, persistência/backup, cancelamento, limpeza de peso/data e preservação do histórico/ativo. Conferência visual em **320 e 390 px**, com capturas sintéticas `test-results/aviso-peso-390.png` e `aviso-peso-320.png`. Bundle Android em `.tools/body-weight-20261020/android-bundle/`. **Não foi recompilado nem instalado um APK com esta alteração**; a recompilação/revisão abaixo é anterior a ela.

## Nova revisão geral — 20/10/2026

Código, testes, dependências e configuração permanecem idênticos à validação de 19/10; somente este documento havia recebido o registro da recompilação. Nenhuma nova falha confirmada na revisão. Passaram novamente TypeScript, **104 testes Node**, **75 fluxos Playwright**, **14 testes JVM executados novamente**, Prettier e Expo Doctor **21/21** (1.21.5). Entradas inválidas, fórmulas, preservação de histórico e recuperação de persistência passaram nos probes adicionais. Busca por padrões de credenciais sem ocorrências nos 188 arquivos de texto atuais e 250 blobs históricos; 517 assinaturas de pacotes e 128 atestações verificadas.

Consulta npm atual mantém **15 ocorrências altas**, derivadas de braces/node-forge nas ferramentas Metro/CLI, sem versão posterior publicada desses dois pacotes e sem presença deles no mapa do bundle Android. O APK release e `../entrega/ritmo-android-20261020.apk` têm SHA-256 `3a56452b6a162fbdb6baa47489e6c5477c4589884f10293ec26a29d48cc7f99e`: assinatura, regras de backup, componentes e correspondência das 57 fontes próprias (incluindo `index.ts`) conferidos novamente. A cópia sem data em `../entrega/ritmo-android.apk` continua anterior.

Esta revisão não recompilou nem instalou APK e não repetiu AVD, captura de tráfego ou testes em aparelho físico. Somente dados sintéticos no navegador/testes; dados do Pixel preservados. Relatório e evidências em `.tools/review-20261020/`. A primeira tentativa JVM não tinha `ANDROID_HOME`; a execução final com o SDK configurado passou. O servidor web exclusivo foi encerrado após os testes para permitir a finalização do Playwright.

## Revisão completa de segurança — 19/10/2026

Revisados fonte, dependências, backups/persistência, motor de fórmulas, substâncias/blends e o APK release atual. Nenhuma nova vulnerabilidade confirmada no escopo verificado. TypeScript, **104 testes Node**, **75 fluxos Playwright**, **14 testes JVM** e Expo Doctor **21/21** aprovados. Passaram os 14 grupos anteriores de probes (261 mutações inválidas), mais 36 expressões proibidas, 17 casos de parâmetros inválidos, dez modelos/bancos malformados e conferências de orçamento, cache e aplicação atômica. Assinaturas de 517 pacotes e 128 atestações verificadas; busca por padrões de credenciais sem ocorrências em 188 arquivos de texto atuais e 250 blobs históricos.

A consulta npm mantém **15 ocorrências altas, zero críticas/moderadas**, derivadas dos mesmos avisos de braces 3.0.3 e node-forge 1.4.0 nas ferramentas Metro/CLI; a consulta ao registro não encontrou versões posteriores desses dois pacotes. Eles não aparecem no mapa do bundle de produção. O APK em `android/app/build/outputs/apk/release/app-release.apk`, **50.379.344 bytes**, SHA-256 `3a56452b6a162fbdb6baa47489e6c5477c4589884f10293ec26a29d48cc7f99e`, mantém a assinatura existente e as proteções de backup/componentes Android. As 56 fontes próprias mais `index.ts` correspondem ao código atual. **A cópia em `../entrega/ritmo-android.apk` permanece anterior**, com SHA-256 `ea32ad973dbea7fe1676838e8fd6402119dce2bbb49759abfcfb9b8bfc054535`; não foi substituída nesta inspeção.

No AVD exclusivo **Ritmo_Build16_QA** (`emulator-5566`), atualização preservou o banco sintético, backup com tentativa de código em fórmula foi recusado sem alterar dados, backup válido com fórmulas/doses/blend foi restaurado exatamente e projeção abriu normalmente. Com adbd sem root, leitura do banco/run-as e chamadas externas aos serviços foram recusadas. O AVD de QA foi encerrado; o Pixel do usuário não foi alterado. Sem nova compilação release, captura de tráfego ou teste em telefone físico. Relatório, limites e evidências em `.tools/security-full-20261019/`.

## Recompilação do APK existente — 20/10/2026

Executado novamente o Gradle release assinado, com sucesso em **2 min 36 s**, sem alterar o código ou a versão **1.0.5/build 22**. TypeScript aprovado; as **56 fontes próprias** do bundle corresponderam aos arquivos atuais. Assinatura existente verificada e manifesto com `allowBackup=false`. O resultado é idêntico ao APK compilado em 19/10: **50.379.344 bytes**, SHA-256 `3a56452b6a162fbdb6baa47489e6c5477c4589884f10293ec26a29d48cc7f99e`.

Cópia conferida em `../entrega/ritmo-android-20261020.apk`; a saída do Gradle permanece em `android/app/build/outputs/apk/release/app-release.apk`. O arquivo `../entrega/ritmo-android.apk` anterior não foi substituído. Evidências em `.tools/apk-20261020/`. Esta rodada recompilou a mesma versão, sem nova instalação ou repetição dos testes de interface/domínio; as validações de 19/10 continuam identificadas abaixo.

## Preservação do histórico ao corrigir fórmulas — testes de 19/10/2026

Adicionados **nove testes de domínio** e **quatro fluxos de interface** para mudanças de expressão, parâmetros, passos intermediários, lados/equipamento, cadência, remoção, adição posterior e edição manual. As comparações incluem o JSON completo do histórico e do ativo, valores de calorias, cópia do modelo, persistência e exportação/restauração de backup. Correções sucessivas mantêm cada sessão com seus parâmetros originais. Lote inválido e prévia desatualizada não gravam parcialmente. Modelos de substâncias preservam as ingestões antigas e suas projeções; novas ingestões usam o modelo corrigido.

Validação final: TypeScript, **104 testes Node** completos e **10 fluxos Playwright selecionados** (os quatro novos e os seis existentes de fórmulas) aprovados. Na interface, histórico e ativo conservaram **2 kcal**, enquanto um treino iniciado após a troca usou **100 kcal** com as mesmas repetições/carga. Finalizar o ativo após corrigir o planejamento manteve a fórmula antiga; registros sem fórmula permaneceram sem estimativa. O editor manual normaliza passos ausentes para `steps: []`, sem alterar os modelos armazenados nas sessões anteriores.

Foram alterados somente testes e este registro. Não foi encontrada falha de preservação nos cenários exercitados; não houve mudança no código do app, novo APK ou novo teste nativo. Os cenários usaram dados fictícios isolados no Node/navegador e não editaram os dados do Pixel. A rodada inicial teve ajustes no roteiro de retorno do detalhe histórico e na expectativa do formato normalizado pelo editor; a repetição final passou integralmente. Logs em `.tools/formula-history-20261019/` e captura `test-results/historico-formula-original-preservada.png`.

## Correção de fórmulas com IA — 19/10/2026

A tela **Fórmulas em lote** ganhou **Correção desejada (opcional)** e o atalho **Corrigir fórmulas com IA**. O botão copia o pedido, as regras do formato e o catálogo atual para levar a uma IA externa. A resposta continua sendo colada e conferida na prévia antes de aplicar. O prompt orienta revisar somente os modelos, preservar os IDs e omitir alterações sem fundamentação. Pedido e JSON têm proteção de saída; copiar não grava no banco nem envia dados pela rede.

Validação: TypeScript, **95 testes Node** e os **71 fluxos Playwright** aprovados (70 na suíte completa; o novo fluxo foi repetido após corrigir seus dados fictícios e a leitura de quebras de linha do clipboard do Windows). Cobertos pedido personalizado, proteção do rascunho, conteúdo copiado sem histórico/ingestões, colagem da resposta, prévia sem gravação e aplicação com persistência, preservando séries, ativo e histórico. Interface conferida em **320 e 390 px**, capturas `test-results/corrigir-formulas-ia-*.png`.

Release recompilado em **1 min 20 s** e atualizado no **Pixel_7_2** (`emulator-5554`) por `adb install -r`. Mantida a versão **1.0.5/build 22**, assinatura existente e as **56 fontes próprias** conferidas contra o bundle. O hash instalado correspondeu ao compilado: `3a56452b6a162fbdb6baa47489e6c5477c4589884f10293ec26a29d48cc7f99e`, em `android/app/build/outputs/apk/release/app-release.apk`. No Android, o copiar/colar nativo confirmou o pedido personalizado e o catálogo idêntico ao anterior; o rascunho de teste foi descartado e a tela reaberta vazia para uso. Evidências em `.tools/install-pixel-20261019/`, arquivos `correction-*` e `native-correction-*`. Não foi consultada uma IA externa para validar suas respostas; não houve novo ensaio dos serviços/widgets ou teste em telefone físico. A cópia em `../entrega/` permanece anterior.

## Fórmulas adicionadas depois da criação — teste no Pixel, 19/10/2026

No APK instalado no **Pixel_7_2**, importada pela interface a rotina **Teste bulk formulas**, com dois exercícios e cinco séries, sem modelos de calorias. O catálogo exportado confirmou `calorias: null` nos dois exercícios. Em **Fórmulas em lote**, aplicado um JSON com os mesmos IDs e dois modelos matemáticos fictícios. A prévia reconheceu somente os dois exercícios de teste.

Após encerrar e reabrir o app, o catálogo confirmou os modelos persistidos, os mesmos IDs e a mesma quantidade de exercícios; os demais itens do catálogo permaneceram exatamente iguais. A tela de leitura confirmou repetições **12/10/8** e **15/12**, com descansos **60/75/90 s** e **60/60 s**. Nenhum treino foi iniciado ou histórico editado. A rotina de teste foi deixada cadastrada, sem dia fixo, para consulta do usuário. Evidências e asserções em `.tools/install-pixel-20261019/`, incluindo `bulk-result.json`, `bulk-preview.png` e `routine-after-bulk.png`. Não houve mudança no código do aplicativo, nova compilação ou validação fisiológica dos modelos.

## Compilação e instalação no Pixel — 19/10/2026

Executado `npm.cmd run apk:pixel` com prebuild e Gradle release, concluído em **4 min 17 s**. O APK incorpora o código atual, incluindo fórmulas, substâncias, blends e vínculos com suplementos; as **56 fontes próprias** do mapa do bundle corresponderam aos arquivos atuais. Mantida a versão **1.0.5/build 22** definida em `app.json`.

Instalação por atualização (`adb install -r`) no **Pixel_7_2** (`emulator-5554`), sem desinstalar nem limpar dados. O hash do APK instalado correspondeu ao compilado, a assinatura existente foi confirmada e a tela inicial abriu normalmente com a rotina já cadastrada. TypeScript e **95 testes Node** aprovados nesta rodada. Não foram repetidos Playwright, comparação integral do banco, ensaios nativos de cada feature ou testes em aparelho físico.

APK em `android/app/build/outputs/apk/release/app-release.apk`, SHA-256 `998ee25df0cb1d856894d0a7e7f002e350be663eede7943f0481ff9bee3f50e9`, certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`. Evidências em `.tools/install-pixel-20261019/`. A cópia em `../entrega/` permanece referente à entrega anterior.

## Vínculos de ingestões com suplementos — código de 19/10/2026

O editor de suplementos permite vincular várias substâncias e blends, com seleção recolhível. Qualquer vínculo basta; registrar um blend também marca os suplementos ligados aos componentes. A confirmação de ingestão mostra os suplementos afetados. Novas doses e marcações diárias são gravadas juntas, usando a data local da ingestão e sem duplicar o dia. Erro em componente cancela tudo. Marcar manualmente não cria dose; editar vínculos/modelos ou reabrir não reaplica doses antigas. Excluir ingestões mantém as marcações, com orientação para desfazer em Suplementos. Campos opcionais `substanceIds`/`blendIds` são validados e preservados em backup; bancos antigos seguem válidos.

Validação desta alteração: TypeScript, **95 testes Node**, **70 fluxos Playwright** completos, exportações web e Android/Hermes aprovadas. Conferência visual em **320 e 390 px**, capturas fictícias `test-results/vinculos-suplemento-390.png` e `vinculos-suplemento-320.png`. Cobertos vínculos N:N, data retroativa, idempotência, desfazer manual, persistência/backup, proteção do rascunho e erro sem gravação parcial. Bundle Android em `.tools/supplement-links-20261019/android-bundle/`. **Sem novo APK ou instalação**; a validação de widget/lembretes nativos permanece histórica, usando as projeções diárias existentes.

## Blends de substâncias — código de 19/10/2026

Adicionadas composições reutilizáveis com 2 a 30 substâncias, quantidades por porção e registro de porções fracionadas com horário comum. Cada componente mantém modelo e projeção próprios. A ingestão é construída integralmente antes de persistir e compartilha um orçamento de cálculo; falha em um componente cancela todo o registro. Cada dose guarda identificação do grupo e cópia da composição efetivamente ingerida. Editar/excluir a receita preserva essas doses; desfazer a ingestão remove o grupo inteiro e recalcula residuais seguintes, mantendo ingestões avulsas. Novo campo opcional `substanceBlends`, sem mudança de versão/chave; backup e parser incluem receitas e grupos.

Validação atual: TypeScript, **91 testes Node**, **68 fluxos Playwright** completos, formatação e conferência visual em **320 e 390 px** aprovados. Cobertos quantidades/unidades, modelos independentes, horários comuns, erro sem gravação parcial, edição/exclusão da composição sem alterar histórico, persistência, backup e desfazer o grupo. Capturas com dados fictícios em `test-results/ingestao-blend-390.png` e `ingestao-blend-320.png`. Bundle Android/Hermes exportado em `.tools/blends-20261019/android-bundle/`. **Sem novo APK ou instalação**; build 22 continua anterior às features de fórmulas e blends. Sem novo teste em Android nativo ou aparelho físico.

## Modelos de substâncias, calorias de força e fórmulas em lote — código de 19/10/2026

Implementado motor de expressões sem execução de JavaScript, com até quatro passos intermediários, variáveis permitidas por domínio, limites de tamanho/profundidade/operações e cache limitado. Acompanhamentos de substâncias registram quantidades/horários, guardam modelos por ingestão e permitem soma de contribuições ou modelo conjunto com quatro residuais. Estados são recalculados iterativamente ao inserir no passado/excluir; horários iguais preservam ordem de registro. O exemplo inicial é matemático, sem perfil farmacológico validado.

Calorias de força são calculadas somente para séries concluídas com modelo, usando cópias dos parâmetros de carga/equipamento/cadência e dados corporais da sessão. Campos ausentes ou erro de cálculo aparecem como pendências. Descansos e gasto posterior não entram. Editor de rotinas/divisões e importação `ritmo/1` aceitam modelos opcionais. A tela **Fórmulas em lote**, em Rotinas e Substâncias, exporta os IDs atuais e aplica JSON `ritmo-formulas/1` após prévia, atomicamente, sem duplicar rotinas ou reescrever sessões/ingestões anteriores. Documentação completa em [Fórmulas](FORMULAS.md).

Validação desta alteração: TypeScript, **87 testes Node**, **66 fluxos Playwright** completos, cinco fluxos das novas features repetidos após os últimos ajustes, formatação dos arquivos alterados e `git diff --check` aprovados. Cobertos bloqueio de código/recursão, limites de cálculo, fórmulas não lineares, doses retroativas, persistência/backup, normalização de lados, variáveis ausentes, importação e atualização em lote por ID com preservação de histórico/ativo. Conferência visual em **320 e 390 px**, com dados fictícios; capturas em `test-results/substancias-curva-*.png`, `calorias-forca-*.png` e `formulas-lote-previa.png`.

Bundle JavaScript Android/Hermes exportado com sucesso, sem nova dependência ou permissão, em `.tools/formulas-20261019/android-bundle/`. **Não foi gerado nem instalado um novo APK nesta alteração**; o build 22 abaixo é anterior a essas features. Sem novo ensaio nativo, teste em telefone físico ou validação clínica dos modelos. Pedido de detectar mudanças na ordem dos exercícios somente anotado no TODO.

## Comando de compilação e instalação no Pixel — 16/10/2026

Adicionado `npm.cmd run apk:pixel`, via `scripts/build-install-pixel.ps1`, reutilizando a assinatura e o build release existentes. O comando identifica o AVD pelo nome, espera o boot, prepara o Android, compila, confere assinatura/pacote/versão e instala com `adb install -r`. Antes de anunciar sucesso, compara o SHA-256 do APK instalado com o compilado e abre o app. A opção `-SkipPrebuild` permite reutilizar a configuração nativa após alterações somente em JavaScript/TypeScript. `build-release.ps1` aceita `-NoDaemon`, utilizado pelo instalador para encerrar o Gradle após o build.

Validação do comando: sintaxe PowerShell aprovada; serial de aparelho físico e AVD de nome incorreto recusados antes do build. Prebuild e compilação release completos exercitados; o fluxo com `-SkipPrebuild` compilou em **52 s**, instalou e abriu o Ritmo no **Pixel_7_2** (`emulator-5554`), usando adbd sem root. O hash instalado correspondeu ao APK gerado (`89c4fdfcce3dd30c91e9f4a5df1b2c3ed068fe38266080d2a7f82592fe0a742d`). A comparação externa do JSON antes/depois confirmou preservação exata de uma rotina, 14 históricos e nenhum treino ativo. Evidências em `.tools/script-pixel-20261016/`.

O teste usou a versão **1.0.5/build 22** definida em `app.json`. O APK gerado está em `android/app/build/outputs/apk/release/app-release.apk`; a cópia de distribuição em `../entrega/` abaixo pertence à entrega anterior. Esta tarefa adicionou a automação de build/instalação e não repetiu os testes de regras/interface do aplicativo.

## Aviso de descanso mais compacto — build 22, 16/10/2026

APK release recompilado com JDK 17/SDK 36 para ARM64 e x86_64, incorporando o aviso de descanso em outra página de exercício mais baixo, com os botões de voltar e pausar lado a lado. As **42 fontes próprias** do mapa do bundle Android corresponderam ao código atual. Formato/chave do banco e dependências preservados.

Validação desta entrega: TypeScript, **74 testes Node**, **58 fluxos Playwright** e Gradle release aprovados. O teste do aviso compacto conferiu os controles, dimensões e pausa/retomada em 320 e 390 px. Assinatura válida com o certificado existente `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`; manifesto com `allowBackup=false`. Atualização build 21 → 22 por `adb install -r` no **Pixel_7_2** (`emulator-5554`), seguida de abertura do histórico e de um registro existente. O JSON persistido permaneceu exatamente igual antes/depois, com uma rotina, 14 históricos e nenhum treino ativo. Nenhuma sessão foi iniciada nem série alterada no AVD do usuário. O aviso compacto foi exercitado na web; sem novo ensaio nativo de descanso, testes JVM ou teste em telefone físico.

APK atual: `../entrega/ritmo-android.apk`, **50.269.484 bytes**, SHA-256 `ea32ad973dbea7fe1676838e8fd6402119dce2bbb49759abfcfb9b8bfc054535`. Cópia conferida e `SHA256SUMS.txt` atualizado. Build 21 preservado em `../entrega/ritmo-android-20261016-6e5a2f1b.apk`. Evidências em `.tools/install-pixel7-build22-20261016/`.

## Automação da execução do treino — build 21, 16/10/2026

APK release recompilado com JDK 17/SDK 36 para ARM64 e x86_64, incluindo início do descanso ao confirmar uma série, avanço ao concluir o exercício, opção de ocultar exercícios concluídos e marcação de descanso longo na próxima série ao reiniciar um descanso já encerrado. O cabeçalho da marca fica oculto durante a execução. As **42 fontes próprias** do mapa do bundle Android corresponderam ao código atual. Formato/chave do banco e dependências preservados.

Validação desta entrega: TypeScript, **74 testes Node**, **58 fluxos Playwright** e Gradle release aprovados. Assinatura válida com o certificado existente `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`; manifesto com `allowBackup=false`. Atualização build 20 → 21 por `adb install -r` no **Pixel_7_2** (`emulator-5554`), seguida de abertura do histórico e de um registro existente. Comparação exata do JSON antes/depois confirmou uma rotina, 14 históricos e nenhum treino ativo. Nenhuma sessão foi iniciada nem série alterada no AVD do usuário. Os fluxos de automação foram exercitados na web; não houve novo ensaio nativo de confirmação de séries/descanso, testes JVM ou teste em telefone físico.

APK daquela entrega, agora arquivado em `../entrega/ritmo-android-20261016-6e5a2f1b.apk`: **50.269.328 bytes**, SHA-256 `6e5a2f1b9bda174164582d077598f151cbdcd05f1970f480aeadaed2e9938098`. Build 20 preservado em `../entrega/ritmo-android-20261016-72e3accd.apk`. Evidências em `.tools/install-pixel7-build21-20261016/`.

## Explicações das marcações manuais — build 20, 16/10/2026

APK release recompilado com JDK 17/SDK 36 para ARM64 e x86_64, incorporando as explicações dos ícones de marcação manual do exercício. As **41 fontes próprias** do mapa do bundle Android corresponderam ao código atual. Formato/chave do banco e dependências preservados.

Validação desta entrega: TypeScript, **71 testes Node**, **53 fluxos Playwright** e Gradle release aprovados. Assinatura válida com o certificado existente `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`; manifesto com `allowBackup=false`. Atualização build 19 → 20 por `adb install -r` no **Pixel_7_2** (`emulator-5554`). No Android, conferidos a abertura do histórico e um registro existente. Não havia marcações manuais nesses registros para ensaiar o novo modal sem criar dados; suas interações foram cobertas na web. O JSON persistido ficou exatamente igual antes/depois, com uma rotina, 14 históricos e nenhum treino ativo. Nenhuma sessão foi iniciada nem marcação alterada. Sem novos testes JVM, ensaios dos avisos nativos ou testes em telefone físico.

APK daquela entrega, agora arquivado em `../entrega/ritmo-android-20261016-72e3accd.apk`: **50.265.404 bytes**, SHA-256 `72e3accd3090b600a3dbb63a23821bd3c318d7c8562db2668987afef054e4fd6`. Build 19 preservado em `../entrega/ritmo-android-20261016-8e38b7ec.apk`. Evidências em `.tools/install-pixel7-build20-20261016/`.

## Inspeção da alteração posterior ao build 19 — 16/10/2026

Os ícones de marcação manual em `ExerciseFeedback.tsx` passaram a abrir explicações, usando estado local e textos fixos. A revisão da diferença em relação ao snapshot da inspeção anterior não identificou nova falha de segurança. Dependências, permissões, módulos nativos, backup e persistência permaneceram iguais. TypeScript, **71 testes Node**, exportação web e **15 fluxos Playwright afetados** aprovados, incluindo conferência de que abrir/fechar as explicações não modifica os dados. Evidências em `.tools/security-delta-build19-20261016/`.

Naquela revisão, o APK de entrega continuava idêntico ao build 19 abaixo e ainda não continha essa alteração. Não houve nova compilação, instalação, teste Android ou consulta npm durante a revisão da diferença; o build 20 acima incorporou a alteração posteriormente.

## Nova inspeção de segurança — build 19, 16/10/2026

Revisados o código atual, os novos campos booleanos por série, backups/restauração, persistência, modais, dependências e o APK entregue. Nenhuma nova vulnerabilidade confirmada no escopo inspecionado. TypeScript, **71 testes Node**, **48 fluxos Playwright**, Expo Doctor **21/21** e 14 grupos extras de probes aprovados, com 261 mutações inválidas recusadas. Assinaturas de **517 pacotes** e **128 atestações** verificadas. Busca por padrões de credenciais sem ocorrências em 157 arquivos de texto atuais e 250 blobs históricos, sem garantir ausência de todos os tipos de segredo.

A consulta npm mantém **15 ocorrências altas, zero críticas/moderadas**, propagadas dos mesmos dois avisos de braces/node-forge nas ferramentas Metro/CLI. Esses pacotes não aparecem no mapa do bundle Android de produção. A assinatura, as regras de backup e os componentes não exportados do APK foram reconferidos. As **41 fontes próprias mais `index.ts`** correspondem exatamente ao código atual; o bundle extraído corresponde ao gerado pelo Gradle existente. Hash do APK confirmado como `8e38b7ec216627fb01c77b3c2d28baa4171b2542849e068c8628d8ed1e57ecba`.

Sem alterações funcionais ou de dependências nesta inspeção. Não houve novo build, instalação, AVD, teste JVM, captura de tráfego ou ensaio em telefone físico; a conferência Android desta rodada foi estática sobre o APK atual. Os módulos nativos e plugins não mudaram em relação à revisão do build 16. Relatório e evidências locais em `.tools/security-reaudit-build19-20261016/`.

## Explicações das sugestões e marcações — build 19, 16/10/2026

APK release recompilado com JDK 17/SDK 36 para ARM64 e x86_64, incluindo os modais de explicação das sugestões automáticas de carga e dos símbolos da última série. Conteúdo compartilhado por `ExplanationModal.tsx`, sem alteração do formato/chave do banco. As **41 fontes próprias** presentes no mapa do bundle Android corresponderam aos arquivos atuais.

Validação desta entrega: TypeScript, **71 testes Node**, **48 fluxos Playwright** e Gradle release aprovados. Assinatura válida com o certificado existente `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`; manifesto com `allowBackup=false`. Atualização build 18 → 19 por `adb install -r` no **Pixel_7_2** (`emulator-5554`). No Android, retomado o treino e conferidas as explicações de aumentar carga e dos detalhes da última série, com fechamento por X, Voltar e Entendi. O JSON persistido permaneceu exatamente igual antes/depois, com uma rotina, 14 históricos e treino ativo. Nenhuma marcação foi alterada. Sem novos testes JVM, ensaios dos avisos nativos ou testes em telefone físico.

APK daquela entrega, agora arquivado em `../entrega/ritmo-android-20261016-8e38b7ec.apk`: **50.262.556 bytes**, SHA-256 `8e38b7ec216627fb01c77b3c2d28baa4171b2542849e068c8628d8ed1e57ecba`. Revisão anterior do build 18 preservada em `../entrega/ritmo-android-20261016-7ceb9790.apk`. Evidências em `.tools/install-pixel7-build19-20261016/`.

## Layout compacto recompilado — build 18, 16/10/2026

Novo APK release com as opções de série mais finas, raio sobreposto ao braço no símbolo de cãibra e três opções de carga na mesma linha, com Impedimento externo abaixo. Mantém versão **1.0.5**, `versionCode` **18** e o certificado anterior. JDK 17/SDK 36, ARM64 e x86_64; Gradle release aprovado. As **40 fontes próprias** do mapa conferem com os arquivos atuais e o bundle dentro do APK é idêntico ao bundle compilado.

Validação da compilação desta revisão: TypeScript, **71 testes Node**, **2 fluxos Playwright afetados** e conferência visual/geométrica em 320 e 390 px. O APK foi preparado para instalação por outro chat, conforme solicitado.

Na instalação seguinte, em 16/10/2026, o APK desta revisão foi aplicado com `adb install -r` no **Pixel_7_2** (`emulator-5554`). Conferidos a assinatura existente, as 40 fontes próprias do mapa contra o código atual e o SHA-256 do APK instalado, idêntico ao da entrega abaixo. Treino retomado, três controles da série visíveis e detalhes abertos/recolhidos; JSON persistido exatamente igual antes/depois, com uma rotina, 14 históricos e treino ativo. App deixado aberto, sem alterar marcações. Evidências da instalação em `.tools/install-layout-20261016/`. Não foram repetidos os testes automatizados da compilação nem ensaios em telefone físico.

APK daquela revisão, agora arquivado em `../entrega/ritmo-android-20261016-7ceb9790.apk`: **50.257.036 bytes**, SHA-256 `7ceb9790ab618fe4d1ba3c9e6b1545d96b91df87d2ef1ae34e5726069a2523b3`. APK anterior preservado em `../entrega/ritmo-android-20261016-589bd02a.apk`. Evidências e dados para instalação em `.tools/release-layout-20261016/`.

## Cãibra por série — build 18, 16/10/2026

APK release recompilado com JDK 17/SDK 36 para ARM64 e x86_64, incluindo **Cãibra** como terceira marcação independente da série, ao lado de **Descanso longo** e **Rest-pause**. O impedimento legado do exercício continua preservado nos registros antigos, sem novo controle para marcá-lo. O campo opcional da série participa do histórico, backup e ressalvas visuais sem mudar a versão/chave do banco. As **40 fontes próprias** do mapa do bundle Android corresponderam ao código atual.

Validação desta entrega: TypeScript, **71 testes Node**, **43 fluxos Playwright** e Gradle release aprovados. Assinatura válida com o mesmo certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`; manifesto com `allowBackup=false`. Atualização build 17 → 18 por `adb install -r` no **Pixel_7_2** (`emulator-5554`), seguida de retomada do treino e abertura/recolhimento dos detalhes da primeira série. Os três controles ficaram visíveis; nenhuma marcação foi alterada durante a conferência. O JSON persistido permaneceu exatamente igual ao anterior à atualização, com uma rotina, 14 sessões históricas e treino ativo. Sem novos ensaios dos avisos nativos, testes JVM ou testes em telefone físico.

APK daquela compilação, agora arquivado em `../entrega/ritmo-android-20261016-589bd02a.apk`: **50.256.780 bytes**, SHA-256 `589bd02ae681aa70635c33c89a1f4e6850664b3f8b1095c2719b12c0dab7b831`. Build 17 preservado em `../entrega/ritmo-android-20261016-313df236.apk`. Evidências em `.tools/install-pixel7-build18-20261016/`.

## Detalhes de execução por série — build 17, 16/10/2026

APK release recompilado com JDK 17/SDK 36 para ARM64 e x86_64, incluindo **Descanso longo** e **Rest-pause** por série, faixa de detalhes recolhível, símbolos no campo de carga e na comparação com a última sessão, além das ressalvas nas sugestões automáticas de carga. Campos opcionais compatíveis com bancos antigos, sem alteração da versão/chave persistida. As **40 fontes próprias** presentes no mapa do bundle Android corresponderam ao código atual, incluindo `SetExecutionDetails.tsx` e o parser.

Validação desta entrega: TypeScript, **70 testes Node**, **42 fluxos Playwright**, Expo Doctor **21/21** e Gradle release aprovados. Assinatura válida com o mesmo certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`; manifesto com `allowBackup=false`. Atualização build 15 → 17 por `adb install -r` no **Pixel_7_2** (`emulator-5554`), seguida de retomada do treino e abertura/recolhimento dos detalhes da primeira série. Os dois controles ficaram visíveis e nenhuma marcação foi alterada no AVD. Comparação exata do JSON persistido antes/depois confirmou preservação de uma rotina, 14 sessões históricas e treino ativo. Sem novos ensaios dos avisos nativos, testes JVM ou testes em telefone físico.

APK daquela entrega, agora arquivado em `../entrega/ritmo-android-20261016-313df236.apk`: **50.256.268 bytes**, SHA-256 `313df2360d643788075e65717e24ce41db84317f1c81d4e546d57ab89ac888cd`. Build 16 preservado em `../entrega/ritmo-android-20261016-a08fca67.apk`. Evidências em `.tools/install-pixel7-build17-20261016/`.

## Nova compilação e revisão de segurança — build 16, 16/10/2026

Recompilação release com JDK 17/SDK 36 para ARM64 e x86_64. Expo passou de 57.0.28 para **57.0.30** e expo-asset de 57.0.19 para **57.0.20**, patches indicados pelo Expo Doctor dentro do SDK 57; a instalação adicionou o config plugin de expo-asset. O formato/chave do banco e as regras de treino permanecem iguais. TypeScript, **66 testes Node**, **33 fluxos Playwright**, **14 testes JVM** e Expo Doctor **21/21** aprovados. Os probes extras passaram em 14 grupos, incluindo 261 mutações inválidas e falhas de restauração/rollback.

A revisão de fonte, dependências e APK não identificou novas vulnerabilidades no escopo verificado. A consulta npm mantém **15 ocorrências altas, zero críticas/moderadas**, propagadas de dois avisos em braces 3.0.3 e node-forge 1.4.0 nas ferramentas Metro/CLI; ambos seguem sem versão corrigida publicada na consulta. Esses pacotes não constam no mapa do bundle de produção Android. Assinaturas de **517 pacotes** e **128 atestações** verificadas. Busca por padrões de credenciais em 152 arquivos de texto atuais e 250 blobs históricos sem ocorrências; isso não garante ausência de todo tipo de segredo.

Assinatura v2 válida, com o certificado existente `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`. APK sem debug, backup automático/OTA desativados, permissões bloqueadas ausentes, serviços/receptores próprios e providers não exportados. Exclusões compiladas: 9 nas regras de backup e 27 na extração/transferência. As **40 fontes próprias** do mapa correspondem ao código atual e o bundle extraído do APK é idêntico ao gerado pelo Gradle.

No AVD exclusivo **Ritmo_Build16_QA**, Android 15/35, `emulator-5566`, o roteiro de cadastro, série concluída, retomada e histórico preparou dados fictícios no build 15. A atualização **15 → 16** preservou exatamente o JSON com uma rotina, um histórico e treino ativo, retomado com 1/3 séries. Backup com IDs duplicados recusado sem modificar o banco; backup v1 válido restaurado após prévia e confirmação, com conteúdo conferido no disco. Com adbd sem root e UID shell 2000, `run-as` e leitura direta do banco foram recusados, assim como chamadas externas aos dois serviços próprios. Descanso de 10 s concluiu em segundo plano; cardio emitiu dois avisos com a tela apagada. O AVD foi iniciado sem áudio: os logs não comprovam audibilidade/ducking em telefone físico. O emulador do usuário e os aparelhos físicos não foram alterados.

APK daquela entrega, agora arquivado em `../entrega/ritmo-android-20261016-a08fca67.apk`: **50.251.552 bytes**, SHA-256 `a08fca673fbf6b7458c15947689e912fc6c850c5d1552e55663a88a5098437fe`. Build 15 preservado em `../entrega/ritmo-android-20261014-2f0f83d9.apk`. Evidências e relatório em `.tools/security-build16-2026-10-16/`. AVD exclusivo encerrado após os testes. Sem teste em telefone físico nem captura dinâmica de tráfego nesta revisão.

## Sugestões compactas instaladas no Pixel 7 (2) — build 15, 14/10/2026

APK release recompilado com JDK 17/SDK 36 para ARM64 e x86_64, incluindo as sugestões automáticas de carga como ícones de 40 × 40 ao lado de **Último treino**, com nomes acessíveis e sem cartão explicativo. Os cinco arquivos de interface conferidos no mapa do bundle Android corresponderam exatamente às fontes atuais.

Validação desta entrega: TypeScript, **66 testes Node**, **33 fluxos Playwright** e Gradle release aprovados. Assinatura válida com o mesmo certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`; manifesto com `allowBackup=false`. Atualização build 14 → 15 por `adb install -r` no **Pixel_7_2** (`emulator-5554`), seguida de retomada do treino e conferência visual/acessível da sugestão compacta de aumentar carga. O JSON persistido permaneceu exatamente igual ao anterior à atualização, com uma rotina, 14 sessões históricas e treino ativo. Nenhum registro foi criado ou alterado no AVD. Sem novos ensaios de avisos nativos ou testes em aparelho físico.

APK daquela entrega, agora arquivado em `../entrega/ritmo-android-20261014-2f0f83d9.apk`: **50.251.548 bytes**, SHA-256 `2f0f83d9f820bd68fa8dfdc87077f5592941f60cd1291d593717779499352aa1`. Build 14 preservado em `../entrega/ritmo-android-20261014-383d5093.apk`. Evidências em `.tools/install-pixel7-build15-20261014/`.

## Código instalado no Pixel 7 (2) — build 14, 14/10/2026

APK release recompilado com JDK 17/SDK 36 para ARM64 e x86_64, incorporando as alterações locais de interface: cabeçalho compacto do treino, alinhamento das séries, geometria estável dos destaques, aviso compacto de descanso em outro exercício, cartão recolhível **Algum ponto importante?** e distância estimada acumulada do cardio. Os cinco arquivos de interface alterados foram comparados com o conteúdo do mapa do bundle Android e corresponderam exatamente ao código atual.

Validação desta entrega: TypeScript, **66 testes Node**, **33 fluxos Playwright** e Gradle release aprovados. Assinatura válida com o mesmo certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`. Atualização por `adb install -r` no **Pixel_7_2** (`emulator-5554`) confirmada como build 14. No Android, retomada a sessão existente e conferidas abertura/recolhimento do cartão de lembretes; o JSON persistido permaneceu exatamente igual, com uma rotina, 14 sessões históricas e treino ativo. Não foram criados novos registros no AVD do usuário. A distância do cardio foi validada na web, sem iniciar uma sessão no AVD. Não foram repetidos ensaios dos avisos nativos ou testes em aparelho físico.

APK daquela entrega, agora arquivado em `../entrega/ritmo-android-20261014-383d5093.apk`: **50.252.228 bytes**, SHA-256 `383d50937a8c7ecca3fd5af7ce2d99911a5a5d627cefdcabb652e213c0fc462f`. Build 13 preservado em `../entrega/ritmo-android-20261014-6146db78.apk`. Logs, capturas, conferência das fontes e comparação do banco em `.tools/install-pixel7-20261014/`.

## Entrega após a reauditoria — build 13, 14/10/2026

APK release 1.0.5/build 13 compilado com JDK 17/SDK 36, ARM64 e x86_64, incorporando as novas validações de backup e dependências. Assinatura v2 válida, com o mesmo certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`; nenhuma chave foi criada/substituída. O manifesto mantém `allowBackup=false`, OTA desativado, serviços/receptores próprios não exportados e remoção das permissões bloqueadas. Regras compiladas: 9 exclusões de backup completo e 27 nas políticas de extração/transferência. O bundle empacotado corresponde ao gerado pelo Gradle; as 40 fontes próprias do mapa correspondem exatamente ao código atual.

No AVD exclusivo **Ritmo_Build13_QA**, Android 15/35, `emulator-5564`, a atualização build 12 → 13 preservou exatamente o JSON fictício com uma rotina, um treino histórico e treino ativo com uma série concluída. Após atualizar, a sessão foi retomada com `1/3 séries`. Backup com ID duplicado foi recusado pelo seletor nativo antes da prévia, preservando o mesmo banco. Backup v1 válido abriu a prévia, exigiu confirmação, foi restaurado e manteve o mesmo JSON conferido no disco. O roteiro nativo de cadastro, registro, retomada e histórico foi executado inicialmente no build 12 para montar o cenário de atualização. O emulador do usuário (`emulator-5554`) não foi alterado nesta entrega.

Ainda no build 13, descanso de 10 s iniciado pela interface registrou início e conclusão no `RitmoRestCue` com o Ritmo em segundo plano. Cardio de três etapas de 10 s registrou dois avisos de troca de velocidade no `RitmoCardioCue` com a tela apagada. O AVD foi iniciado sem áudio: os logs confirmam a execução nativa, sem afirmar audibilidade ou redução real de volume em aparelho físico. Evidências em `native-cues.json` e nos dois logs de cue da pasta desta entrega.

A reauditoria anterior desta mesma data passou em TypeScript, **66 testes Node**, **32 fluxos Playwright**, **14 testes JVM**, Expo Doctor **21/21**, 261 mutações de entradas e cenários extras de rollback. Assinaturas de 516 pacotes npm e 125 atestações foram verificadas. Permanecem 15 ocorrências altas transitivas das ferramentas de build (`braces`/`node-forge`), sem novas falhas encontradas no código. Evidências da auditoria em `.tools/security-reaudit-2026-10-14/`; da entrega nativa em `.tools/release-build13-2026-10-14/`.

APK daquela entrega, agora arquivado em `../entrega/ritmo-android-20261014-6146db78.apk`: **50.250.632 bytes**, SHA-256 `6146db785cc7a78e9d4f63ca7f9b65d1c230296954e95c50e946b2975e0283ea`. O build 12 foi preservado em `../entrega/ritmo-android-20261013-877eeb4e.apk`. Não houve instalação em aparelho físico ou atualização do emulador do usuário durante aquela entrega.

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
