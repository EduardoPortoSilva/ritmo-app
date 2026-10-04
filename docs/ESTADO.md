# Estado e validação

Referência: **04/10/2026**. O código continua sendo a fonte de verdade. Resultados históricos pertencem à entrega mencionada e não substituem testes de uma alteração futura.

## Código atual

Aplicativo `com.ritmo.treinos`, versão **1.0.5**, Android `versionCode` **7**. Base instalada registrada no lockfile: Expo **57.0.23**, React Native **0.86.3**, React **19.2.3**. Android é a plataforma principal; web facilita desenvolvimento/testes; iOS não foi validado.

Implementados: força com divisões/conjuntos e pausa do planejamento, programação semanal, séries e descansos individuais, retomada de sessão, histórico e gráficos, peso corporal, vínculos/mapa muscular, cardio por etapas com distância, suplementos diários, widgets/lembretes Android, importação `ritmo/1` e backup completo `ritmo-backup/1`.

## Revisão documental e preparação dos commits — 04/10/2026

As mudanças acumuladas desde `cc236fb` foram revisadas e organizadas por assunto: widget de treinos, widget de suplementos, versão 1.0.5/build 7 e documentação compartilhada. Os guias de uso, fundamentos e módulos agora explicam as faixas compactas, o cartão vertical, o conteúdo oculto em 1×1 e o redimensionamento pelo launcher. O banco e as regras de lembretes permanecem iguais; sequências de suplementos continuam na aba do app.

Verificações executadas nesta revisão: TypeScript aprovado; **52 testes Node** aprovados; **14 testes JVM** reexecutados e aprovados (6 de estado do widget de treinos, 4 de agenda de lembretes e 4 de estado do widget de suplementos); formatação e links locais conferidos. Os metadados de versão em `app.json`, `package.json` e `package-lock.json` são consistentes. A inspeção do conteúdo candidato ao Git não encontrou arquivos privados/gerados nem os padrões de credenciais pesquisados; isso não é uma auditoria integral de segurança.

O APK existente foi identificado com `aapt` como 1.0.5/build 7 e seu SHA-256 foi reconferido, coincidindo com a entrega abaixo. Não houve nova compilação release, instalação, teste em aparelho/emulador, Playwright, Expo Doctor ou consulta de dependências nesta revisão. As evidências nativas e web das entregas anteriores continuam identificadas nas suas seções.

Os commits desta preparação são locais, na branch `master`; o remoto `origin` aponta para `https://github.com/EduardoPortoSilva/ritmo-app.git`. Esta tarefa não inclui push.

## Widgets 1×2 — 04/10/2026

Os widgets de treinos e suplementos agora podem ser reduzidos horizontalmente até uma célula e aumentados verticalmente para duas. Em 1×2, o Android seleciona um layout vertical com marca, contagem e resumo curto; o treino mantém o ponto de estado, e suplementos mostram o primeiro pendente com `+N` separado. Em 1×1, o resumo é ocultado para evitar corte. As faixas 3×1/4×1 e os destinos de toque permanecem. `minResizeWidth=48dp`, `maxResizeHeight=260dp` e `resizeMode=horizontal|vertical` permitem a mudança, sujeita à grade do launcher.

Validação da entrega: testes JVM de ambos os módulos e Gradle release aprovados. No AVD isolado `RitmoCompactQA`, ambos foram redimensionados de fato para 1×2 e fotografados; foram conferidos descanso, contagem, suplemento pendente, `+N`, fonte a 140% e abertura do app/aba Suplementos pelo toque. O `dumpsys appwidget` confirmou `resizeMode=3` para os dois. Não houve teste em celular físico nem repetição da suíte web, pois esta mudança é nativa. O AVD `Pixel_7` foi atualizado do build 6 para o 7 com `adb install -r` e o app abriu normalmente.

APK atual: `../entrega/ritmo-android.apk`, versão 1.0.5, `versionCode` 7, 49.438.908 bytes, SHA-256 `2a6ac773a4c00452ff76c6fb4b1ffb8b180bb5f883a41cf4a19d6868f7d27e94`, certificado SHA-256 `d0464b3181984648839196b9e094c00f8cc8a90d8cab873870a0a4f900a91070`. O build 6 anterior foi arquivado em `../entrega/ritmo-android-20261004-1b7ca9af.apk`.

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
- Widgets/lembretes podem atrasar em economia de bateria ou após forçar parada. Aviso de cardio depende do painel/JavaScript; descanso nativo é transitório e não retorna após reiniciar o processo/aparelho.
- A revisão v4 registrou caminho possível de aviso perdido caso `startForeground()` falhe internamente; a ponte pode já ter informado sucesso ao JavaScript. Não foi reproduzido naquela revisão.
- O Expo Doctor histórico passou 20/21 checks, pedindo `expo~57.0.26` enquanto o lock estava em 57.0.23. Dependências não foram atualizadas nesta preparação.
- A auditoria histórica registrou advisories transitivos de `node-forge`/`uuid` nas ferramentas Expo. Reconsultar e analisar antes de uma distribuição; nenhuma correção automática foi aplicada aqui.
- Build EAS de nuvem não validado como equivalente ao release local; credenciais precisam de configuração própria e a CLI do comando não tem versão fixa.
- A rotina de exemplo criada nos dados de teste continua com remoção adiada pelo usuário; veja [TODO](../TODO.md). Ela não é conteúdo padrão do código/APK.

## Manter este registro

Ao entregar uma mudança, registre o que realmente foi executado, resultado e limitações. Se houver novo APK, inclua versão, hash, assinatura e onde foi testado. Preserve a distinção entre código, bundle JavaScript e APK instalado.
