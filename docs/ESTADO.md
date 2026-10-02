# Estado e validação

Referência: **02/10/2026**. O código continua sendo a fonte de verdade. Resultados históricos pertencem à entrega mencionada e não substituem testes de uma alteração futura.

## Código atual

Aplicativo `com.ritmo.treinos`, versão **1.0.0**, Android `versionCode` **4**. Base instalada registrada no lockfile: Expo **57.0.23**, React Native **0.86.3**, React **19.2.3**. Android é a plataforma principal; web facilita desenvolvimento/testes; iOS não foi validado.

Implementados: força com divisões/conjuntos e pausa do planejamento, programação semanal, séries e descansos individuais, retomada de sessão, histórico e gráficos, peso corporal, vínculos/mapa muscular, cardio por etapas com distância, suplementos diários, widgets/lembretes Android, importação `ritmo/1` e backup completo `ritmo-backup/1`.

## Preparação para o GitHub — 02/10/2026

A documentação compartilhada passou a ficar em `docs/`, dentro da raiz Git. Foram acrescentados README, guia de uso, dados, contribuição, segurança e envio ao GitHub. As instruções e o teste do catálogo importável passaram a usar os caminhos versionados, permitindo um clone sem `.codex/` local.

A revisão inicial desta preparação encontrou 51 de 52 testes aprovados: o caso restante lia o caminho antigo `.codex/IMPORTACAO.md`, já ausente. A referência foi corrigida para `docs/IMPORTACAO.md`. Validação atual desta preparação: TypeScript aprovado, **52 testes Node aprovados**, links Markdown locais conferidos sem destinos ausentes e formatação Prettier aprovada após ajustar três arquivos existentes do módulo de descanso. Também foram conferidas as exclusões de chave/credenciais, backups pessoais, dependências instaladas e artefatos gerados. Não foram repetidos Playwright, Expo Doctor, audit de dependências ou testes nativos nesta tarefa documental.

Nenhum novo APK foi compilado ou instalado nesta tarefa de documentação. O banco, as funcionalidades e a assinatura não foram alterados. Nenhum repositório remoto foi configurado; o destino GitHub será definido posteriormente.

## Última entrega Android — evidência histórica

A entrega de código de 02/10/2026 acrescentou o serviço nativo de aviso de descanso em segundo plano. Naquela entrega, passaram TypeScript, 52 testes Node, 23 fluxos Playwright e Gradle release. Em AVD isolado, foram conferidos início/conclusão ao abrir outro app, pausa/cancelamento, retomada e contagem com tela apagada. Não houve teste audível com música de outro app em telefone físico.

APK histórico, mantido localmente fora do Git:

| Campo                         | Referência                                                         |
| ----------------------------- | ------------------------------------------------------------------ |
| Arquivo no workspace original | `../entrega/ritmo-android.apk`                                     |
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
