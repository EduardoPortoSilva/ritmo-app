# Fórmulas, substâncias e calorias de força

O app avalia modelos fornecidos pelo usuário, diretamente ou por JSON gerado externamente, offline. Validar uma expressão não valida suas hipóteses fisiológicas. Referência e hipóteses são obrigatórias e ficam disponíveis junto do modelo. Não há catálogo farmacológico, serviço de IA ou fórmula fisiológica automática embutidos.

## Modelos existentes em lote

Abra **Rotinas → Editar fórmulas em lote**, ou o mesmo botão em **Suplementos → Acompanhar substâncias**. Para revisar modelos existentes, preencha **Correção desejada (opcional)** (até 300 caracteres) e toque em **Corrigir fórmulas com IA**. Isso copia um pedido com as regras do formato e o catálogo atual, incluindo nomes, IDs e modelos, sem ingestões ou histórico. Cole o pedido na IA que você usa, traga o JSON devolvido para **Colar JSON de fórmulas**, confira a prévia e aplique. O app não se conecta a um serviço de IA nem altera dados ao copiar. O pedido orienta preservar modelos ausentes e omitir alterações sem fundamentação; essa orientação não garante a qualidade da resposta da IA.

Também é possível copiar somente o catálogo ou carregá-lo diretamente no editor para edição manual. O pedido e o JSON têm proteção contra saída acidental da tela; o rascunho não é persistido ao fechar o aplicativo.

O lote é atômico: ID desconhecido, item repetido ou modelo inválido cancela tudo. Se um modelo mudar após a prévia, confira novamente. Não cria rotinas, exercícios ou substâncias nem altera nomes, séries, cargas, metas ou ordem. Sessões ativas, históricos e ingestões anteriores preservam seus modelos; mudanças valem para próximos treinos/ingestões. Não há recálculo retroativo automático.

```json
{
  "formato": "ritmo-formulas/1",
  "exercicios": [
    {
      "rotinaId": "ID copiado do catálogo",
      "exercicioId": "ID copiado do catálogo",
      "calorias": {
        "formula": {
          "expression": "totalLoad * reps * k",
          "steps": [],
          "parameters": { "k": 0.01 },
          "reference": "EXEMPLO MATEMÁTICO. Coeficiente fictício, sem validade fisiológica."
        },
        "loadBasis": "per-side",
        "loadMultiplier": 1,
        "secondsPerRep": 3
      }
    }
  ],
  "substancias": []
}
```

`calorias: null` remove o modelo do planejamento. Campos opcionais `rotina` e `exercicio` são rótulos informativos; a identidade é o par `rotinaId` + `exercicioId`. Substâncias usam `{ "id": "ID", "modelo": SubstanceModel }`, com `nome` informativo opcional. Itens omitidos permanecem. Máximo 250.000 caracteres por lote, além do limite do banco.

## Linguagem matemática

`Formula`: `expression`, `parameters` (objeto numérico), `reference` (texto obrigatório até 500 caracteres) e `steps` opcional. Unidades são definidas abaixo; o motor não faz análise dimensional automática.

- Operadores `+ - * / % ^`, comparações `< <= > >= == !=`, lógicos `&& || !`. Booleanos valem 0 ou 1. Ponto decimal e notação científica. Potência associa à direita: `2^3^2 = 512`; `-2^2 = -4`.
- Funções `exp`, `ln`/`log` (natural), `sqrt`, `abs`, `sin`, `cos`, `floor`, `ceil`, `round`, `min`, `max`, `pow`, `clamp(x, mínimo, máximo)`, `if(condição, sim, não)`. Constantes `pi` e `e`. `if`, `&&`, `||` avaliam só os ramos necessários.
- Até quatro linhas em `steps`, avaliadas em ordem como `v1..v4`. Cada passo usa somente os anteriores; a expressão final usa os passos calculados. Sem loops, funções próprias, recursão, código JavaScript ou solução automática de equações diferenciais.
- Até 1.200 caracteres e 256 tokens por expressão; análise até 24 níveis; 16 parâmetros finitos de módulo até 1 bilhão. Nomes não colidem com variáveis, funções, constantes ou `v1..v4`.
- Intermediários finitos, de módulo até 1 trilhão. Cada cálculo/curva compartilha um teto de 300.000 operações. Cache limitado a 64 expressões. Exceder limites mostra erro; não troca erro por zero nem executa indefinidamente.

## Substâncias

**Suplementos → Acompanhar substâncias** permite configurar nome, unidade, modelo e ingestões com quantidade e horário local. As confirmações diárias podem ser vinculadas opcionalmente às ingestões, como descrito abaixo. Ingestões anteriores são permitidas; futuras são recusadas. Exclusão exige confirmação. Limites: 30 acompanhamentos e 200 ingestões por acompanhamento, sujeitos ao teto de 1.500.000 bytes UTF-8 do banco.

**Importar modelo de substância** aceita `{ "name": "Nome", "unit": "mg", "model": SubstanceModel }` e abre a edição para conferir e salvar. Para alterar existentes, use o lote `ritmo-formulas/1`.

`SubstanceModel` contém `formula`, `mode` (`sum` ou `state`), `absorptionHours`, `halfLifeHours` e `horizonHours`. Os três números são positivos, até 8.760 horas. Variáveis: `t` (horas desde ingestão), `d` (quantidade), `a` (absorção) e `h` (meia-vida). Saída na unidade cadastrada, entre 0 e 1 bilhão.

Exemplo ilustrativo: `d * (1 - exp(-ln(2)*t/a)) * exp(-ln(2)*t/h)`, com parâmetros fictícios `a=1`, `h=5`. Nesse exemplo, `a` é meia-vida de absorção. Meia-vida de absorção, tempo médio de absorção e tempo até o pico não são equivalentes; o significado do parâmetro precisa constar na referência. O exemplo não é um perfil farmacológico validado.

Em `sum`, cada ingestão guarda uma cópia da fórmula e parâmetros. O total soma as contribuições. Isso pressupõe contribuições aditivas e não representa interações conjuntas não lineares.

Em `state`, somente a curva da última ingestão é avaliada. `p1` é o valor da curva anterior no instante da nova ingestão; `p2..p4` são os três residuais anteriores tal como registrados nos respectivos eventos, sem projetá-los ao instante atual. Inicialização: quatro zeros. São escalares armazenados, não chamadas recursivas ou um solucionador geral de compartimentos. A fórmula deve ser compatível com essas entradas; estados latentes adicionais não são inferidos.

Registros são ordenados por horário, preservando a ordem de registro em empates. Inserir uma ingestão anterior ou excluir uma existente recalcula os residuais seguintes iterativamente, preservando o modelo de cada evento. O estado é guardado por ingestão e verificado ao ler o banco/backup. Modo e unidade ficam bloqueados enquanto houver registros; use outro acompanhamento para mudá-los. Editar fórmula/parâmetros vale para próximas ingestões.

O gráfico projeta 33 pontos a partir de agora sem novas ingestões. Atualização a cada 30 segundos e ao voltar ao primeiro plano; sem serviço em segundo plano. Mostra quantidade estimada, sem representar concentração sanguínea, efeito ou recomendação da próxima dose.

### Blends de substâncias

Em **Suplementos → Acompanhar substâncias → Novo blend**, selecione de 2 a 30 substâncias já cadastradas e informe a quantidade de cada uma por porção, na respectiva unidade. Dê um nome à composição e salve para reutilizar, ou escolha **Salvar e registrar blend**. Na ingestão, informe a quantidade de porções (frações são aceitas), data e horário; a prévia mostra as quantidades totais.

Todos os componentes recebem o mesmo horário e cada um mantém o próprio modelo, curva e residuais. O registro é atômico: erro de modelo, quantidade, unidade, horário ou armazenamento impede a gravação de todos os componentes. O cálculo compartilha um único orçamento de operações entre eles. Não são inferidas interações entre substâncias.

Cada dose guarda a identificação comum da ingestão, nome do blend, porções e uma cópia da composição efetivamente ingerida, com nomes, unidades e quantidades totais. Editar ou excluir a composição salva preserva essas doses. **Excluir ingestão do blend** desfaz o grupo inteiro e recalcula os residuais seguintes, mantendo ingestões avulsas.

Até 50 composições salvas, sujeitas ao limite de armazenamento do banco. Se uma substância for removida ou mudar de unidade, o blend salvo permanece para correção e não pode ser ingerido até atualizar a composição. A unidade não é convertida automaticamente. O banco aceita o campo opcional `substanceBlends: {id, name, components: {substanceId, amount, unit}[]}[]`; `amount` é por porção. Doses podem ter `blend: {intakeId, blendId, name, servings, components}`; nesses componentes há também `name` e a quantidade total ingerida. Blends e identificação dos grupos entram no backup; bancos anteriores continuam válidos.

### Marcação automática dos suplementos

Em **Suplementos → Editar suplemento → Marcar por ingestão → Vincular substâncias e blends**, escolha quantas substâncias e composições quiser. Qualquer vínculo basta: uma ingestão avulsa marca os suplementos vinculados àquela substância; uma ingestão de blend marca os vinculados à receita e a cada componente. Uma mesma substância ou blend pode marcar vários suplementos. A confirmação da ingestão mostra os nomes que serão marcados.

O app adiciona a data local da ingestão a `takenOn`, uma única vez por dia, junto com as doses na mesma atualização do banco. Ingestões retroativas marcam o dia informado. Falha na ingestão impede também a marcação. Lembretes e widget usam o mesmo registro diário. Essa direção não cria outras doses em cadeia; para gerar doses ao confirmar o suplemento, configure a opção abaixo.

Os vínculos valem somente para novas ingestões: salvar vínculos, mudar fórmulas ou reabrir o app não reaplica registros antigos. Excluir uma ingestão ou acompanhamento mantém a marcação diária, que pode ser desfeita na aba Suplementos. Os campos opcionais `Supplement.substanceIds` (até 30 IDs) e `blendIds` (até 50) entram no backup. Referências removidas ficam visíveis no editor para desvincular, sem invalidar bancos antigos. Não há associação automática por nome nem conferência de dose mínima para marcar um suplemento.

### Dose configurada e histórico de suplementos

Em **Editar suplemento → Dose ao tomar o suplemento**, selecione a substância e informe a quantidade na unidade cadastrada. Pode configurar várias substâncias. **Tomei hoje** registra essas doses no instante real do clique e salva esse horário em `Supplement.takenAt`, além da confirmação diária em `takenOn`. Ainda é uma confirmação por dia. Desfazer remove somente as doses que vieram dessa confirmação, preservando ingestões avulsas e de blends. Registros antigos sem horário não ganham um timestamp inventado. A marcação automática por ingestão continua independente e não cria um ciclo de doses.

Para aproveitar dias já marcados, use **Aproveitar o histórico**, informe a **hora média de ingestão** e toque em **Conferir histórico de ingestões**. Se houver um horário de confirmação salvo para um dia, ele tem preferência. Os demais usam a hora média e ficam identificados como estimados na lista de ingestões. A prévia usa a dose configurada e o modelo atual, uma ingestão por dia; não recupera quantidades, modelos ou horários reais que não foram registrados. Só **Salvar vínculo e importar** grava as novas doses e o vínculo, juntos. Salvar o suplemento normalmente não importa o passado.

Um dia que já tenha ingestão daquela substância é ignorado conservadoramente, inclusive se a dose existente foi avulsa ou de blend; horários futuros também são ignorados. As contagens e os primeiros 50 itens aparecem na prévia. Use a data inicial para revisar períodos menores ou respeitar o limite de 200 ingestões por substância, sem truncar/apagar registros antigos. Mudança no banco, modelos ou dose após a prévia exige nova conferência. O lote recalcula residuais iterativamente, preserva modelos dos eventos existentes e compartilha o orçamento de operações. Erro de cálculo ou de armazenamento impede a atualização completa.

O backup preserva `Supplement.substanceDoses: {substanceId, amount, unit}[]`, com quantidade como texto decimal, `takenAt: {dia: instanteISO}` e a origem opcional da dose em `SubstanceDose.supplement: {supplementId, supplementName, day, estimatedTime}`. A origem permite reconhecer duplicatas e desfazer somente o registro correspondente. Excluir o suplemento mantém as ingestões existentes com a identificação histórica. Bancos antigos sem esses campos continuam válidos, na mesma versão/chave.

## Calorias dos treinos de força

**Rotinas → Dados para estimativas** permite informar peso e altura opcionais. Novas sessões recebem uma cópia. O peso é sempre o registro válido mais recente entre perfil (`weightRecordedAt`) e todas as sessões finalizadas (`finishedAt`), independentemente da rotina e da ordem do histórico. Em empate, o histórico prevalece. A mesma escolha preenche o editor de dados e o contexto do prompt de importação. Na finalização, corrija peso e altura daquela sessão, se necessário. Editar perfil preserva sessões iniciadas e históricas.

O início mostra um aviso logo abaixo do card principal quando o registro mais recente tem **mais de sete dias**; exatamente sete dias ainda não exibe o aviso. **Atualizar peso** abre os dados e volta ao início após salvar ou cancelar. Digitar outro peso registra a data atual; para uma nova pesagem com o mesmo valor, use **Confirmar este peso para hoje** e salve. Alterar só a altura ou salvar sem confirmar não renova a data do peso. Um peso salvo na finalização de treino usa a data dessa finalização.

Perfis anteriores sem data continuam válidos: pesos do histórico com data têm preferência. Sem histórico datado, o peso legado pode ser usado, com aviso para confirmar uma pesagem recente. Sem nenhum peso cadastrado, não há aviso de registro antigo. O campo opcional `BodyProfile.weightRecordedAt` é preservado em backup e validado sem mudar a versão do banco.

No editor de rotina/divisão, **Definir calorias de [exercício]** configura o modelo por série. A importação `ritmo/1` também aceita `calorias` opcional. O prompt pode solicitar modelos fundamentados de força, usando perfil como contexto e mantendo variáveis na expressão; sem base suficiente, a IA deve omitir o campo.

`EnergyModel`, exportado no lote, contém `formula`, `loadBasis`, `loadMultiplier` (0,01 a 20) e `secondsPerRep` (0,1 a 60). A saída é kcal por série concluída. Variáveis:

| Variável     | Unidade e significado                                      |
| ------------ | ---------------------------------------------------------- |
| `bodyWeight` | Peso corporal em kg, se informado.                         |
| `height`     | Altura em cm, se informada.                                |
| `load`       | Carga digitada em kg.                                      |
| `sides`      | 2 para `per-side`/`per-hand`, 1 para `total`/`unilateral`. |
| `totalLoad`  | `load × sides × loadMultiplier`.                           |
| `reps`       | Repetições realizadas.                                     |
| `seconds`    | Tempo estimado: `reps × secondsPerRep`.                    |

Unilateral representa um lado por série; para executar ambos registre séries separadas. A normalização só alimenta a fórmula; não modifica cargas nem o volume antigo do app. Modelo e referência são copiados para a sessão.

Somente séries concluídas entram. Resultado por série de 0 a 10.000 kcal. Variável ausente, erro numérico ou falta de modelo aparecem como pendência, sem inventar zero. A cobertura informa quantas séries têm estimativa. O resultado se refere às séries, com cadência assumida, e não inclui descansos ou gasto posterior ao treino. Normalizar carga não mede força real, trabalho mecânico ou gasto metabólico; a qualidade depende da fonte e hipóteses do modelo.

## Dados e implementação

Versão/chave permanecem `Database.version: 1` e `@ritmo/database/v1`. Campos novos opcionais: `bodyProfile`, `substances`, `PlannedExercise.energyModel`, `LoggedExercise.energyModel`, `Workout.bodyHeight`. Backups incluem e validam modelos e residuais; dados antigos sem esses campos continuam válidos.

Motor em `src/formulas.ts`; domínios em `src/substances.ts`, `src/energy.ts`; edição em lote em `src/formulaBulk.ts`. Sem nova dependência, permissão Android ou comunicação com IA/rede.
