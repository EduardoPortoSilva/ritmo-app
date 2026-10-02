# Documentação do Ritmo

Estes guias fazem parte do repositório e devem funcionar em um clone independente. Caminhos de código são relativos à raiz que contém `package.json`, salvo indicação explícita.

## Para usar o aplicativo

- [Guia de uso](USO.md): planejamento, execução, histórico e recursos do Android.
- [Cardio](CARDIO.md): etapas, cronômetro, distância e limites dos avisos.
- [Importação por texto](IMPORTACAO.md): contrato completo `ritmo/1`, exemplo e IDs musculares.
- [Backup e assinatura](BACKUP-E-ASSINATURA.md): exportação, restauração e continuidade da distribuição Android.
- [Músculos](MUSCULOS.md): catálogo, vínculos, contagens, fontes e limites do mapa.

## Para desenvolver e manter

- [Fundamentos](FUNDAMENTOS.md): arquitetura, regras e comportamento por funcionalidade.
- [Dados](DADOS.md): esquema persistido, formatos externos e compatibilidade.
- [Desenvolvimento](DESENVOLVIMENTO.md): ambiente, comandos, testes e geração do APK.
- [Estado e validação](ESTADO.md): versão atual, testes atuais e evidências históricas.
- [Preparar e enviar ao Git](GIT.md): conteúdo versionado, arquivos locais e envio ao remoto.
- [Contribuição](../CONTRIBUTING.md): rotina de mudanças e validação.
- [Segurança](../SECURITY.md): dados locais, assinatura e relato de falhas.
- [Pendências](../TODO.md): pedidos e lembretes preservados do desenvolvimento.

## Integrações Android

Cada módulo documenta sua implementação e seu roteiro nativo:

- [Widget de treinos](../modules/ritmo-widget/README.md).
- [Lembretes e widget de suplementos](../modules/ritmo-reminders/README.md).
- [Aviso de descanso](../modules/ritmo-rest/README.md).

No workspace original, `.codex/` e `.claude/` ficam fora da raiz Git e guardam orientações, evidências e configurações locais. Um clone não precisa dessas pastas para consultar os guias ou executar os testes. Os registros históricos locais podem ter mais detalhes; os documentos versionados devem descrever o comportamento atual sem depender deles.
