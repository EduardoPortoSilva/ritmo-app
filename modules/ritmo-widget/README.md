# Widget Android do Ritmo

Módulo Expo local, descoberto automaticamente em `modules/`. Não editar o projeto Android gerado para manter esta integração. O manifesto, os recursos e o código Kotlin aqui são versionados e sobrevivem ao prebuild. Não há dependência nativa adicional em produção.

- `RitmoWidgetModule`: recebe a projeção JSON e solicita a fixação pelo launcher.
- `WidgetStore`: lê o cache privado, independente do banco de treinos.
- `WidgetStatus`: calcula o estado usando o calendário e fuso local; testável sem Android.
- `RitmoWidgetProvider`: desenha as RemoteViews, abre o app ao tocar e atualiza o dia sem JavaScript em segundo plano.
- `res/`: faixa compacta e cartão vertical 1×2, com indicador de estado, fontes, cores e metadados de redimensionamento.

O JSON contém apenas `routines: [{id, name, weekdays}]` e `completions: [{routineId, finishedAt}]`, com término em milissegundos desde Unix epoch. A geração fica em `src/widgetSnapshot.ts`. Séries, cargas e peso corporal não são copiados. O banco v1 continua sendo a fonte de verdade; o cache é refeito ao abrir o app e após uma gravação bem-sucedida na fila de persistência.

Uma rotina programada está feita quando existe pelo menos uma sessão salva dessa rotina cuja data local de término seja hoje. Sessões parciais salvas contam; sessões em andamento não. Várias sessões da mesma rotina contam uma vez. A faixa mostra feitos/previstos e o primeiro pendente com `+N`; o ponto indica pendência, conclusão ou descanso. Excluir uma sessão ou editar a programação recalcula o estado. Sem programação, o widget orienta configurar dias; num dia livre, mostra descanso.

Atualizações ocorrem após salvar os dados, nos eventos do sistema (reinício, ajuste de hora/fuso e atualização do APK), periodicamente a cada 30 minutos e por alarme não exato na virada do dia. O Android pode adiar atualizações em economia de energia; não prometemos troca exata à meia-noite. Não há notificações nem permissão de alarme exato. Forçar parada nas configurações pode desativar o widget até abrir o aplicativo novamente, conforme comportamento do Android.

## Redimensionamento

O provider consulta as opções de cada instância do widget e redesenha em `onAppWidgetOptionsChanged`. A largura mínima informada pelo launcher abaixo de 180 dp seleciona `ritmo_widget_portrait.xml`; abaixo de 300 dp, o layout horizontal usa o resumo estreito. No cartão vertical com altura mínima abaixo de 120 dp (aproximadamente 1×1), o resumo e `+N` ficam ocultos. As medidas em células dependem da grade do launcher.

Os metadados definem alvo inicial 4×1, `minResizeWidth=48dp`, `minResizeHeight=54dp`, limites máximos de 500×260 dp e redimensionamento horizontal/vertical. O resumo horizontal abrevia o primeiro pendente em 24 caracteres; o vertical, em 16. `+N` ocupa uma view independente, preservando a indicação de outros pendentes quando o nome é abreviado. O ponto substitui as carinhas na apresentação e não muda a regra de conclusão.

Um launcher pode conservar o tamanho ampliado de uma instância após atualização do APK. Remover e fixar novamente somente o widget recupera a geometria inicial sem limpar dados do app.

## Validação

Da raiz do repositório:

```powershell
npm.cmd run typecheck
npm.cmd test
cd android
.\gradlew.bat :ritmo-widget:testDebugUnitTest
```

Para gerar o APK release com a assinatura exigida, siga [Backup e assinatura](../../docs/BACKUP-E-ASSINATURA.md). No emulador dedicado a testes, instale o APK e:

1. Crie uma rotina com o dia atual e adicione o widget pelo botão da tela Início. Confirme a contagem, o ponto de pendência e o nome.
2. Toque no widget, inicie o treino e confirme uma série. Antes de salvar a sessão, volte à tela do Android: o widget deve continuar pendente.
3. Finalize e salve o treino (parcial também é válido): a contagem e o ponto devem indicar conclusão.
4. Volte ao launcher e encerre o processo em segundo plano com `am kill` (não `force-stop`). Confira o estado e reabra tocando no widget.
5. Exclua a sessão de teste: o estado deve voltar a pendente.
6. Edite a rotina para outro dia: confira descanso. Remova todos os dias: confira a orientação de configuração.
7. Confira a legibilidade em 4×1, 3×1 e 1×2, com fonte ampliada, nomes longos e múltiplas pendências. O `+N` deve continuar visível ao truncar o nome.

Não conclua nem exclua treinos reais para executar esse roteiro. Os testes JVM cobrem múltiplas rotinas, repetição, limites de meia-noite, próxima semana, domingo, fuso e alterações na programação.
