# Guia de uso

O Ritmo abre sem cadastro e guarda os dados neste aparelho/navegador. As abas principais são Início, Rotinas, Gráficos, Suplementos e Histórico.

Ao tocar em um campo, a tela ajusta a rolagem para deixá-lo acima do teclado. Você pode continuar rolando para ler o restante sem recolher o teclado. Campos de texto/JSON grandes também permitem rolagem dentro do próprio campo. O comportamento vale para formulários, séries e modais de edição.

## Planejar musculação

Na aba **Rotinas**, crie uma rotina avulsa ou uma divisão com vários treinos. Informe nome, exercícios e metas de repetições de cada série. É possível repetir um valor entre séries e depois ajustar cada uma individualmente, por exemplo 12/10/8 repetições e 60/90/120 segundos de descanso.

Selecione dias da semana para a programação ou deixe a rotina livre. Várias rotinas podem ocupar o mesmo dia. Salvar abre a consulta do planejamento; use **Ver rotina** para consultar sem editar. Ao sair de um editor realmente alterado, confirme se quer descartar o rascunho.

Os **conjuntos de rotinas** guardam planos anteriores. Somente o conjunto ativo entra no planejamento principal e no widget de força. Uma mesma rotina pode pertencer a vários conjuntos; editar essa rotina modifica o planejamento compartilhado. Excluir um conjunto remove os vínculos, mantendo rotinas e histórico.

A grade de atalhos reúne seis ações em duas linhas de três: Pausar força, Cobertura muscular (braço flexionado), Cardio (coração com batimento), Importar treinos (robô), Backup e Conjuntos. **Nova divisão** e **Nova rotina** ficam separadas da grade. Os atalhos mantêm seus destinos; o robô identifica a importação de planejamento por texto, que pode ser gerado com uma IA.

**Pausar treinos de força** abre uma confirmação e só oculta esse planejamento após **Confirmar pausa**, sem apagá-lo. Cancelar ou Voltar do Android mantém o planejamento ativo. A pausa não interrompe uma sessão ativa nem pausa cardios. O mesmo atalho passa a **Retomar força**; retome diretamente ou ative outro conjunto. Sem rotinas no planejamento ativo, Pausar fica desabilitado.

## Registrar o treino

O cabeçalho até a barra verde permanece visível ao rolar: Voltar, nome do treino, filtro e progresso. Ao lado das séries concluídas aparece a porcentagem com duas casas decimais, como `1/6 séries · 16.67%`.

Inicie uma rotina pela consulta ou pela tela Início. Há no máximo uma sessão de força ativa; iniciar outra direciona ao treino em andamento. O app copia o planejamento para a sessão, então mudanças posteriores na rotina não modificam o treino iniciado.

A execução mostra um exercício por vez. Informe repetições e carga e confirme cada série realizada. Zero kg é aceito; carga vazia não confirma a série. Alterar repetições/carga desmarca a conclusão. Anterior/Próximo muda o exercício sem confirmar séries automaticamente.

O card **Série atual** permanece no topo, mesmo sem descanso. Ele mostra a primeira série ainda pendente na ordem do treino, e não apenas o exercício que você está consultando. Ao terminar um exercício, passa à série pendente do próximo. A seta de retorno em U leva diretamente à linha dessa série, inclusive se ela estiver mais abaixo na mesma tela. Se todas forem concluídas, o card informa que o treino está pronto para finalizar.

Confirmar uma série inicia o descanso configurado, se maior que zero. Ao concluir todas as séries de um exercício, o app avança ao próximo e mantém o descanso em andamento; a contagem e o botão de pausa/retomada aparecem no card **Série atual**. A seta retorna à série pendente, mesmo quando o descanso veio do exercício anterior. Ao terminar o último exercício, a tela permanece no lugar e não inicia outro descanso. Se confirmar a última linha antes das demais, o app espera as séries pendentes antes de avançar.

Ative **Ocultar concluídos** para navegar só pelos pendentes. Desative para revisar os que já terminou; nenhum registro é removido. Se todos estiverem concluídos, use **Mostrar exercícios concluídos** ou finalize o treino. O filtro começa desligado quando você sai e retoma a tela. O cabeçalho grande da marca não aparece durante a execução para deixar mais espaço às séries.

Ao repetir uma rotina, as cargas válidas das séries concluídas da sessão finalizada mais recente são sugeridas por exercício e posição da série. Metas e marcadores de conclusão começam de novo. Uma sessão retomada preserva os valores já preenchidos.

Ao lado da meta, confira repetições e peso da mesma série no último treino. O botão com ícone de gráfico de barras no cabeçalho do exercício abre seu gráfico em um modal; feche para continuar preenchendo as séries.

Abaixo de Anterior/Próximo, marque **Aumentar carga**, **Manter carga** ou **Diminuir carga** como lembrete do exercício para a próxima sessão. **Impedimento** registra cansaço, cãibra ou outra dificuldade pessoal e pode ser marcado junto. Toque novamente para desmarcar; as escolhas persistem ao continuar depois e aparecem no histórico. No próximo treino, os lembretes do último registro ficam no cabeçalho do exercício: dois triângulos verdes para cima (aumentar), dois amarelos para baixo (diminuir), igual azul (manter) e triângulo vermelho com exclamação (impedimento). Os ícones se referem ao exercício inteiro e não ajustam o peso automaticamente.

O ícone de progressão aparece quando você concluiu todas as séries com os mesmos pesos e atingiu as metas nos dois últimos treinos. Mudanças de metas/séries reiniciam essa comparação. Marcar manter, diminuir ou impedimento no último treino oculta o aviso automático.

**Impedimento externo** registra falta de tempo, equipamento ocupado ou outra situação externa; tem um relógio cinza e é independente de Impedimento. Se estiver marcado em qualquer um dos dois últimos treinos, ambas as sugestões automáticas ficam bloqueadas, sem buscar sessões mais antigas.

As sugestões do app usam **um único triângulo**: verde para cima (progredir) ou vermelho para baixo (diminuir). A redução aparece quando, em cada um dos dois últimos treinos, mais da metade de todas as séries ficou abaixo de metade da meta, considerando apenas registros concluídos e válidos. Ex.: meta 12, fazer 5 conta como abaixo de metade; 6 não. Séries pendentes não contam como falha. Metas e quantidade de séries precisam continuar iguais. O aviso não altera a carga.

**Observações do exercício** aceita texto livre de até 300 caracteres, como “Barra W”, “máquina” ou ajustes do banco. Está no editor da rotina/divisão e na execução. Durante o treino, o texto aparece somente no cabeçalho do exercício; toque no lápis para abrir o modal e em **Salvar observações** para guardar a mudança na sessão atual e no planejamento do mesmo exercício, para reutilizar nos próximos treinos. Cancelar, fechar pelo X ou voltar no Android descarta o rascunho. Registros antigos conservam suas próprias observações; editar o planejamento também preserva um treino já iniciado.
Use o descanso da série para iniciar, pausar ou retomar a contagem. No APK Android, o aviso nativo toca três bipes mesmo ao abrir outro app ou apagar a tela. Sair da tela de treino ou pausar cancela esse aviso. O descanso é transitório e não é retomado depois de reiniciar o processo/aparelho. Na web e no Expo Go, o som depende da tela e do JavaScript ativos.

Se esperar o descanso acabar e tocar em **Reiniciar descanso**, a próxima série pendente logo abaixo recebe **Descanso longo** automaticamente. Isso vale apenas dentro do mesmo exercício: reiniciar o descanso da última série nunca marca o exercício seguinte. Pausar e retomar antes do término não gera essa indicação. A marcação pode ser revisada nos detalhes da série.

### Quando você muda a ordem dos exercícios

Se A vem antes de B no cadastro, mas você concluiu todas as séries de B antes de marcar a primeira série de A, o app pergunta se a ordem mudou. Confirme cada par ou escolha **Não, só registrei depois**. A ordem do cadastro e os pesos permanecem como estavam.

No próximo treino desta rotina, a primeira consulta de cada exercício envolvido abre um aviso com a ordem cadastrada e a realizada, lembrando que isso pode afetar as cargas. Um símbolo amarelo com dois retornos em U fica junto das sinalizações de carga. Cada troca tem seu próprio símbolo; toque para rever aquele par. Fechar o aviso evita repeti-lo automaticamente naquela sessão, inclusive ao reabrir o app.

## Finalizar e consultar a evolução

Finalize após confirmar pelo menos uma série. Sessões parciais são permitidas, com aviso das séries pendentes. A etapa final oferece **peso corporal opcional**, sugerindo o último peso válido salvo, inclusive de outra rotina. Apagar o campo salva somente o treino. O histórico só recebe a sessão após confirmar **Salvar treino**.

No **Histórico**, consulte séries feitas/pendentes, duração e volume. A duração inclui o tempo com o app fechado. O volume usa somente séries concluídas: repetições realizadas × carga. Cada treino de força tem uma cor e, se o planejamento de exercícios ou metas mudou, uma indicação da fase. O percentual de esforço compara o volume com o maior registro da mesma rotina e fase. Excluir um registro exige confirmação e também remove sua contribuição nos gráficos/widgets.

A aba **Gráficos** abre com peso corporal e esforço relativo por data. Escolha 30 dias, 90 dias, 1 ano ou tudo; o máximo usado para o esforço continua sendo o maior registro de toda a fase, mesmo fora da janela visível. 1.000 de 1.500 kg·repetições aparece como 66%. Cores e rótulos separam rotinas diferentes, ainda que tenham o mesmo nome, e fases após mudar exercícios ou metas. Treinos sem carga externa não têm percentual calculável. Abaixo, escolha um exercício para ver carga máxima, repetições da série mais pesada e carga efetiva total com escala própria. A tela Início também mostra o histórico completo de peso. Esse gráfico cabe na largura da tela, sem deslizar; quando há muitos registros, os rótulos de valores e datas aparecem espaçados. Sessões no mesmo dia continuam sendo pontos distintos.

## Modelos e estimativas

Para acompanhar quantidades estimadas de substâncias, abra **Suplementos → Acompanhar substâncias** e cadastre um modelo e suas ingestões. Para calorias de força, configure **Rotinas → Dados para estimativas** e um modelo por exercício. As fórmulas existentes também podem ser editadas juntas em **Editar fórmulas em lote**, por JSON com prévia. O [guia de fórmulas](FORMULAS.md) explica unidades, cópias históricas e limites das estimativas.

O peso usado nos próximos treinos é o registro mais recente entre os dados de referência e o histórico. Se ele tiver mais de uma semana, aparece um aviso logo abaixo de **Encontre seu ritmo** no início. Use **Atualizar peso**; se a pesagem de hoje continuar igual, toque em **Confirmar este peso para hoje** e salve. Alterar só a altura não renova a data do peso.

Na tela de substâncias, **Novo blend** salva uma mistura com quantidades por porção. **Registrar blend** permite informar porções e um horário único para todos os componentes. Cada substância segue seu modelo; o registro é feito de uma vez, e a exclusão da ingestão desfaz o grupo inteiro.

## Classificar músculos

No editor, associe grupos, músculos ou porções a cada exercício como principal/secundário. A classificação é opcional e informada por você; não é deduzida do nome. O botão **?** mostra os vínculos daquele exercício, inclusive os copiados para uma sessão antiga.

A **Cobertura muscular** apresenta o planejamento no mapa e as séries associadas. Um vínculo amplo não preenche automaticamente músculos filhos. O mapa é esquemático e inclui projeções aproximadas; suas cores não medem intensidade ou ativação. Regras em [Músculos](MUSCULOS.md).

## Cardio

Em **Rotinas de cardio**, crie etapas com minutos e velocidade em km/h. Inicie, pause e retome o painel. O cronômetro acompanha o tempo real e recupera a posição após sair/reabrir. A tela permanece acesa enquanto o painel aberto está rodando.

O aviso anterior à mudança de velocidade depende do painel aberto e do JavaScript ativo. O app exibe o plano, mas não controla a esteira. Ao encerrar, consulte a distância esperada e informe opcionalmente a distância real. Sessões parciais podem ser salvas. Veja [Cardio](CARDIO.md) para os limites.

## Suplementos e Android

Cadastre hábitos na aba **Suplementos** e marque **Tomei hoje**; a marcação pode ser desfeita. A sequência conta dias consecutivos e é individual. O registro diário é único; ingestões com quantidades e horários ficam na tela de substâncias.

Para marcar automaticamente, edite um suplemento e abra **Marcar por ingestão → Vincular substâncias e blends**. Pode selecionar vários de cada tipo; qualquer um dos vínculos marca esse suplemento. Registrar um blend também marca os suplementos vinculados aos seus componentes. A tela de ingestão mostra os suplementos afetados antes de confirmar e usa a data informada, inclusive no passado. Vale para novas ingestões. Ao excluir uma ingestão, desmarque também o suplemento se precisar corrigir o dia.

Para registrar doses a partir do suplemento, configure **Dose ao tomar o suplemento**, selecionando a substância e a quantidade. **Tomei hoje** cria as doses no horário real do clique e guarda esse instante; desfazer remove só essas doses. Para dias já marcados, use **Aproveitar o histórico**, informe a **hora média de ingestão** e confira a prévia antes de **Salvar vínculo e importar**. Dias com horário de confirmação salvo usam esse horário; os demais ficam identificados como estimados. Dias com ingestão já existente são ignorados para evitar duplicação. Salvar o vínculo sem importar vale só para próximas confirmações.

Um horário de lembrete é opcional. No APK Android, salvar com lembrete solicita a permissão de notificações. Se negada, é possível manter o rascunho ou salvar sem lembrete. O sistema pode atrasar avisos em economia de bateria; forçar parada pode desativá-los até abrir o app novamente.

Adicione os widgets pela tela Início ou pela lista do launcher. Ambos abrem como faixas compactas 4×1, com contagem diária e resumo de pendências. Ao redimensionar, podem virar faixas 3×1 ou cartões verticais 1×2, conforme a grade do launcher. Nomes longos são abreviados, e `+N` indica outros itens pendentes. Em 1×1, o resumo e `+N` ficam ocultos para preservar a contagem.

O widget de treinos usa um ponto para indicar pendência, conclusão ou descanso e considera sessões finalizadas hoje, inclusive parciais. O de suplementos mostra quantos foram tomados hoje e os pendentes; as sequências continuam na aba Suplementos. Tocar abre o app ou a aba correspondente; a confirmação acontece dentro do app. Widgets não exigem que o JavaScript fique aberto, mas suas atualizações também podem ser adiadas pelo Android.

Após atualizar uma versão antiga, o launcher pode conservar o tamanho ampliado de um widget existente. Para obter o novo tamanho inicial, remova somente o widget e adicione-o novamente; essa ação não apaga dados do aplicativo.

## Importar e preservar dados

**Importar treinos por texto** acrescenta planejamento em `ritmo/1`. Confira a prévia antes de confirmar. Use **Copiar instruções para IA** para obter o contrato e o catálogo muscular completos. Um erro invalida o lote inteiro. Veja a [especificação](IMPORTACAO.md).

**Backup e restauração** exporta todo o banco em `ritmo-backup/1`. Guarde o arquivo fora do celular e privadamente: ele é legível e não tem senha. Restaurar substitui os dados atuais após prévia e confirmação. Exporte os dados atuais primeiro se quiser poder voltar. Sem backup manual, desinstalar o aplicativo pode perder os registros. Veja [Backup e assinatura](BACKUP-E-ASSINATURA.md).
