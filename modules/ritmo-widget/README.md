# Widget Android do Ritmo

Módulo Expo local, descoberto automaticamente em `modules/`. Não editar o projeto Android gerado para manter esta integração. O manifesto, os recursos e o código Kotlin aqui são versionados e sobrevivem ao prebuild. Não há dependência nativa adicional em produção.

- `RitmoWidgetModule`: recebe a projeção JSON e solicita a fixação pelo launcher.
- `WidgetStore`: lê o cache privado, independente do banco de treinos.
- `WidgetStatus`: calcula o estado usando o calendário e fuso local; testável sem Android.
- `RitmoWidgetProvider`: desenha as RemoteViews, abre o app ao tocar e atualiza o dia sem JavaScript em segundo plano.
- `res/`: layout redimensionável, carinhas vetoriais e metadados do widget.

O JSON contém apenas `routines: [{id, name, weekdays}]` e `completions: [{routineId, finishedAt}]`, com término em milissegundos desde Unix epoch. A geração fica em `src/widgetSnapshot.ts`. Séries, cargas e peso corporal não são copiados. O banco v1 continua sendo a fonte de verdade; o cache é refeito ao abrir o app e após uma gravação bem-sucedida na fila de persistência.

Uma rotina programada está feita quando existe pelo menos uma sessão salva dessa rotina cuja data local de término seja hoje. Sessões parciais salvas contam; sessões em andamento não. Várias sessões da mesma rotina contam uma vez. Todos os treinos programados precisam estar feitos para a carinha feliz. Excluir uma sessão ou editar a programação recalcula o estado. Sem programação, o widget orienta configurar dias; num dia livre, mostra descanso.

Atualizações ocorrem após salvar os dados, nos eventos do sistema (reinício, ajuste de hora/fuso e atualização do APK), periodicamente a cada 30 minutos e por alarme não exato na virada do dia. O Android pode adiar atualizações em economia de energia; não prometemos troca exata à meia-noite. Não há notificações nem permissão de alarme exato. Forçar parada nas configurações pode desativar o widget até abrir o aplicativo novamente, conforme comportamento do Android.

## Validação

Da raiz do repositório:

```powershell
npm.cmd run typecheck
npm.cmd test
cd android
.\gradlew.bat :ritmo-widget:testDebugUnitTest
```

Para gerar o APK release com a assinatura exigida, siga [Backup e assinatura](../../docs/BACKUP-E-ASSINATURA.md). No emulador dedicado a testes, instale o APK e:

1. Crie uma rotina com o dia atual e adicione o widget pelo botão da tela Início. Confirme a carinha triste e o nome da rotina.
2. Toque no widget, inicie o treino e confirme uma série. Antes de salvar a sessão, volte à tela do Android: o widget deve continuar pendente.
3. Finalize e salve o treino (parcial também é válido): o widget deve ficar feliz.
4. Volte ao launcher e encerre o processo em segundo plano com `am kill` (não `force-stop`). Confira o estado e reabra tocando no widget.
5. Exclua a sessão de teste: o estado deve voltar a pendente.
6. Edite a rotina para outro dia: confira descanso. Remova todos os dias: confira a orientação de configuração.
7. Confira a legibilidade ao redimensionar, inclusive em tamanhos menores e com nomes longos.

Não conclua nem exclua treinos reais para executar esse roteiro. Os testes JVM cobrem múltiplas rotinas, repetição, limites de meia-noite, próxima semana, domingo, fuso e alterações na programação.
