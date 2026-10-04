# Suplementos: notificações e widget Android

Módulo Expo local em Kotlin, descoberto automaticamente em `modules/`. Usa somente APIs Android em produção. Os arquivos deste diretório são a origem versionada; não implemente mudanças apenas em `android/` gerado. A chave do banco de treinos continua `@ritmo/database/v1`.

## Integração

- `src/supplements.ts`: modelo, data local, sequência, confirmação diária e projeções JSON.
- `src/SupplementScreens.tsx`: cadastro, horários e registros no aplicativo.
- `src/reminders.ts`: ponte opcional, permissão de notificações e solicitação para fixar o widget.
- `src/storage.ts`: sincroniza as projeções após salvar na fila serial; refaz os caches ao carregar.
- `ReminderSchedule.kt`: horário local da próxima ocorrência e regras de entrega.
- `SupplementReminders.kt`: cache privado, AlarmManager, canal e entrega das notificações.
- `SupplementWidgetStatus.kt`: contagem e resumo compacto de pendências do widget.
- `SupplementWidgetProvider.kt`: RemoteViews e atualização independente do JavaScript.

O lembrete é individual e opcional, em `HH:mm`. A permissão é solicitada ao salvar um suplemento com lembrete, nunca por apenas abrir o app. Se for negada, o rascunho permanece aberto; é possível desativar o lembrete e salvar. Revogação posterior é indicada na tela de suplementos, sem apagar horários ou registros.

O cache de lembretes inclui somente suplementos com horário ativo: ID, nome, horário e dias confirmados. O widget recebe todos os suplementos, inclusive os sem notificação: ID, nome e dias confirmados. Observações não são copiadas. Esses caches são derivados; nunca devem substituir ou reescrever o banco.

## Regras de calendário

`takenOn` armazena datas locais `YYYY-MM-DD`, no máximo uma por dia e suplemento. Marcar/desmarcar só modifica hoje. A sequência conta os dias consecutivos terminando hoje; se hoje estiver pendente, pode terminar ontem. Um dia inteiro ausente encerra a sequência. Não use diferenças em milissegundos para contar dias nem converta os registros antigos para outro fuso ao viajar.

Cada suplemento tem um alarme inexacto independente por URI de ID. Marcar hoje cancela o aviso visível e desloca o próximo alarme para amanhã; desmarcar antes do horário recoloca o aviso de hoje. Desativar ou excluir remove alarmes e notificações desse suplemento. A entrega lê o cache atual e ignora itens já tomados, excluídos ou já notificados naquele dia. Um aviso atrasado do dia anterior não deve aparecer antes do horário do dia atual. A próxima ocorrência usa Calendar e horário local, sem somar 24 horas fixas.

Reinício, alteração de hora/fuso e atualização do pacote refazem o agendamento. Não há alarme exato, serviço permanente, push remoto ou servidor. O Android pode atrasar avisos em economia de energia e desativá-los ao forçar parada até abrir o app novamente. Não prometa precisão de despertador. O app não sugere doses nem decide que suplementos o usuário deve tomar.

## Widget

O widget mostra a contagem de suplementos tomados hoje e um resumo dos pendentes em uma faixa 4×1. Em 3×1, prioriza o primeiro nome; em 1×2, muda para um cartão vertical com primeiro pendente e `+N`. A sequência permanece na aba Suplementos, mas não aparece na faixa. Ao completar todos, exibe **Tudo em dia!**. Tocar abre `ritmo://suplementos`; a confirmação acontece no aplicativo. O widget não exige permissão de notificações.

Recebe atualização ao salvar/carregar, por eventos do sistema, a cada 30 minutos e por alarme não exato de virada do dia. Atrasos do sistema podem adiar a troca de dia. O tamanho inicial depende do launcher. O widget e as notificações só existem no APK Android; a versão web e Expo Go mantêm cadastro e sequência sem os recursos nativos.

## Redimensionamento

O provider redesenha cada instância ao receber `onAppWidgetOptionsChanged`. A largura mínima informada pelo launcher abaixo de 180 dp seleciona `ritmo_supplements_widget_portrait.xml`; entre 180 e 299 dp, usa o resumo horizontal estreito. No cartão vertical com altura mínima abaixo de 120 dp (aproximadamente 1×1), resumo e `+N` ficam ocultos. O alvo inicial é 4×1 e o tamanho em células depende da grade do launcher.

Na faixa larga, dois pendentes podem aparecer juntos quando seus nomes somam até 24 caracteres. Caso contrário, aparece o primeiro, abreviado em 18 caracteres, com `+N` separado. A faixa estreita usa o primeiro nome abreviado em 10 caracteres; o cartão vertical, em 16. `+N` conta somente os outros pendentes. Os metadados permitem redução até 48×54 dp e aumento até 500×260 dp em ambos os eixos.

As sequências e os lembretes mantêm suas regras no aplicativo; o widget não registra doses por toque. Instâncias antigas podem conservar o tamanho do launcher após atualização: remova e fixe novamente somente o widget para recuperar a geometria inicial.

## Validação

Execute `npm.cmd test`, `npm.cmd run typecheck` e os fluxos Playwright. No Gradle, execute `:ritmo-reminders:testDebugUnitTest`, os testes do widget de treino. Para o release assinado, use o script documentado em [Backup e assinatura](../../docs/BACKUP-E-ASSINATURA.md).

Use um emulador exclusivo com dados fictícios para o teste nativo: configure dois horários diferentes, aceite a permissão, confira as notificações com o app fechado e a abertura da aba Suplementos; marque/desmarque e confira a alteração dos alarmes; desative/exclua um item e confirme o cancelamento. Teste a permissão negada ou revogada. Fixe o widget, confira contagem, pendentes, `+N`, conclusão, fonte ampliada e formatos 1×2, 3×1 e 4×1. Valide que o widget de treinos continua funcionando e que dados reais foram preservados na atualização.
