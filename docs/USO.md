# Guia de uso

O Ritmo abre sem cadastro e guarda os dados neste aparelho/navegador. As abas principais são Início, Rotinas, Gráficos, Suplementos e Histórico.

## Planejar musculação

Na aba **Rotinas**, crie uma rotina avulsa ou uma divisão com vários treinos. Informe nome, exercícios e metas de repetições de cada série. É possível repetir um valor entre séries e depois ajustar cada uma individualmente, por exemplo 12/10/8 repetições e 60/90/120 segundos de descanso.

Selecione dias da semana para a programação ou deixe a rotina livre. Várias rotinas podem ocupar o mesmo dia. Salvar abre a consulta do planejamento; use **Ver rotina** para consultar sem editar. Ao sair de um editor realmente alterado, confirme se quer descartar o rascunho.

Os **conjuntos de rotinas** guardam planos anteriores. Somente o conjunto ativo entra no planejamento principal e no widget de força. Uma mesma rotina pode pertencer a vários conjuntos; editar essa rotina modifica o planejamento compartilhado. Excluir um conjunto remove os vínculos, mantendo rotinas e histórico.

**Pausar treinos de força** oculta esse planejamento sem apagá-lo. A pausa não interrompe uma sessão ativa nem pausa cardios. Retome diretamente ou ative outro conjunto.

## Registrar o treino

Inicie uma rotina pela consulta ou pela tela Início. Há no máximo uma sessão de força ativa; iniciar outra direciona ao treino em andamento. O app copia o planejamento para a sessão, então mudanças posteriores na rotina não modificam o treino iniciado.

A execução mostra um exercício por vez. Informe repetições e carga e confirme cada série realizada. Zero kg é aceito; carga vazia não confirma a série. Alterar repetições/carga desmarca a conclusão. Anterior/Próximo muda o exercício sem confirmar séries automaticamente.

Ao repetir uma rotina, as cargas válidas das séries concluídas da sessão finalizada mais recente são sugeridas por exercício e posição da série. Metas e marcadores de conclusão começam de novo. Uma sessão retomada preserva os valores já preenchidos.

Use o descanso da série para iniciar, pausar ou retomar a contagem. No APK Android, o aviso nativo toca três bipes mesmo ao abrir outro app ou apagar a tela. Sair da tela de treino ou pausar cancela esse aviso. O descanso é transitório e não é retomado depois de reiniciar o processo/aparelho. Na web e no Expo Go, o som depende da tela e do JavaScript ativos.

## Finalizar e consultar a evolução

Finalize após confirmar pelo menos uma série. Sessões parciais são permitidas, com aviso das séries pendentes. A etapa final oferece **peso corporal opcional**, sugerindo o último peso válido salvo, inclusive de outra rotina. Apagar o campo salva somente o treino. O histórico só recebe a sessão após confirmar **Salvar treino**.

No **Histórico**, consulte séries feitas/pendentes, duração e volume. A duração inclui o tempo com o app fechado. O volume usa somente séries concluídas: repetições realizadas × carga. Excluir um registro exige confirmação e também remove sua contribuição nos gráficos/widgets.

A aba **Gráficos** permite consultar evolução sem iniciar treino. Carga máxima e repetições usam a série mais pesada, com desempate por mais repetições. A carga efetiva total soma todas as séries concluídas daquele exercício e usa escala própria. O gráfico corporal na tela Início reúne os pesos salvos. Sessões no mesmo dia continuam sendo pontos distintos.

## Classificar músculos

No editor, associe grupos, músculos ou porções a cada exercício como principal/secundário. A classificação é opcional e informada por você; não é deduzida do nome. O botão **?** mostra os vínculos daquele exercício, inclusive os copiados para uma sessão antiga.

A **Cobertura muscular** apresenta o planejamento no mapa e as séries associadas. Um vínculo amplo não preenche automaticamente músculos filhos. O mapa é esquemático e inclui projeções aproximadas; suas cores não medem intensidade ou ativação. Regras em [Músculos](MUSCULOS.md).

## Cardio

Em **Rotinas de cardio**, crie etapas com minutos e velocidade em km/h. Inicie, pause e retome o painel. O cronômetro acompanha o tempo real e recupera a posição após sair/reabrir. A tela permanece acesa enquanto o painel aberto está rodando.

O aviso anterior à mudança de velocidade depende do painel aberto e do JavaScript ativo. O app exibe o plano, mas não controla a esteira. Ao encerrar, consulte a distância esperada e informe opcionalmente a distância real. Sessões parciais podem ser salvas. Veja [Cardio](CARDIO.md) para os limites.

## Suplementos e Android

Cadastre hábitos na aba **Suplementos** e marque **Tomei hoje**; a marcação pode ser desfeita. A sequência conta dias consecutivos e é individual. Não há múltiplas doses no mesmo dia nem marcação retroativa.

Um horário de lembrete é opcional. No APK Android, salvar com lembrete solicita a permissão de notificações. Se negada, é possível manter o rascunho ou salvar sem lembrete. O sistema pode atrasar avisos em economia de bateria; forçar parada pode desativá-los até abrir o app novamente.

Adicione os widgets pela tela Início ou pela lista do launcher. O widget de treinos considera sessões finalizadas hoje, inclusive parciais. O de suplementos mostra pendências e sequências e abre a aba correspondente; a confirmação acontece dentro do app. Widgets não exigem que o JavaScript fique aberto, mas suas atualizações também podem ser adiadas pelo Android.

## Importar e preservar dados

**Importar treinos por texto** acrescenta planejamento em `ritmo/1`. Confira a prévia antes de confirmar. Use **Copiar instruções para IA** para obter o contrato e o catálogo muscular completos. Um erro invalida o lote inteiro. Veja a [especificação](IMPORTACAO.md).

**Backup e restauração** exporta todo o banco em `ritmo-backup/1`. Guarde o arquivo fora do celular e privadamente: ele é legível e não tem senha. Restaurar substitui os dados atuais após prévia e confirmação. Exporte os dados atuais primeiro se quiser poder voltar. Sem backup manual, desinstalar o aplicativo pode perder os registros. Veja [Backup e assinatura](BACKUP-E-ASSINATURA.md).
