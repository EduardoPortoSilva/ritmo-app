# Modelo de dados e persistência

O perfil corporal aceita `weightRecordedAt?: string`, data válida do cadastro/confirmação do peso. `latestBodyWeight` compara essa data com `finishedAt` das sessões com peso válido; empates favorecem o histórico. Perfis antigos sem data são preservados, com preferência por histórico datado e aviso para confirmar quando só há peso sem data. O início sinaliza registros com mais de sete dias. Alterar só altura não renova a pesagem. Campo opcional incluído no backup, sem mudança de versão/chave.

Suplementos aceitam vínculos opcionais `substanceIds: string[]` e `blendIds: string[]`, preservados no backup. Novas ingestões adicionam a data local a `takenOn` dos suplementos vinculados na mesma atualização das doses. Vários vínculos usam a condição “qualquer um”; várias doses no mesmo dia não duplicam a marcação. Editar esses vínculos não reaplica o passado. Excluir doses mantém o registro diário, que pode ser desfeito manualmente. Referências removidas continuam legíveis para correção no editor. Regras em [Fórmulas](FORMULAS.md#marcação-automática-dos-suplementos).

Na direção suplemento → substância, `Supplement.substanceDoses?: {substanceId, amount, unit}[]` define até 30 doses, com IDs únicos, unidade copiada e quantidade textual decimal positiva até 1 bilhão. Novos cliques de confirmação salvam `takenAt?: Record<dia, instanteISO>`; timestamps referenciam dias de `takenOn`, e ausência preserva o desconhecimento de horários antigos. Doses geradas têm origem opcional `SubstanceDose.supplement: {supplementId, supplementName, day, estimatedTime}`; é incompatível com origem de blend na mesma dose. O parser valida os campos e o backup os preserva, sem mudar a versão/chave. A importação retroativa só ocorre após prévia explícita, usando horário real salvo ou média informada; não preenche `takenAt` com a estimativa. Regras em [Fórmulas](FORMULAS.md#dose-configurada-e-histórico-de-suplementos).

Os campos opcionais de substâncias, perfil corporal e modelos de calorias são detalhados em [Fórmulas](FORMULAS.md). `Database` aceita `substances` e `bodyProfile`; exercícios planejados/registrados aceitam `energyModel`; treinos aceitam `bodyHeight`. Sem mudança da versão/chave. O parser valida as expressões e os residuais armazenados, também na restauração de backups.

Misturas salvas usam o campo opcional `substanceBlends`. Uma ingestão de blend gera doses nas substâncias participantes, com horário comum e identificação/cópia da composição em `SubstanceDose.blend` (`src/substances.ts`). A edição da composição não altera ingestões anteriores. O parser confere quantidades, unidades e a identificação de cada dose no grupo; referências a componentes removidos permanecem nas composições para correção, sem invalidar o restante do banco.

Os tipos e o parser de força estão em `src/model.ts`; cardio, suplementos e conjuntos têm regras em `src/cardio.ts`, `src/supplements.ts` e `src/routineSets.ts`. `src/storage.ts` é o ponto de acesso ao AsyncStorage.

## Banco v1

A chave persistida é `@ritmo/database/v1`. Todo o banco é uma única string JSON com `version: 1`.

| Campo                | Conteúdo e ausência                                                           |
| -------------------- | ----------------------------------------------------------------------------- |
| `version`            | Literal `1`, obrigatório                                                      |
| `routines`           | Planejamento de força, obrigatório                                            |
| `workouts`           | Sessões de força finalizadas, obrigatório                                     |
| `active`             | Sessão de força em andamento ou `null`, obrigatório                           |
| `routineSets`        | Conjuntos com nome e IDs de rotinas; opcional                                 |
| `activeRoutineSetId` | Referência ao conjunto ativo; opcional                                        |
| `strengthPaused`     | Pausa do planejamento de força; ausência mantém força ativa                   |
| `supplements`        | Hábitos, dias confirmados e horário opcional; ausência equivale a lista vazia |
| `cardioRoutines`     | Planejamento de cardio; opcional                                              |
| `activeCardio`       | Sessão de cardio em andamento ou `null`; opcional                             |
| `cardioHistory`      | Sessões de cardio finalizadas; opcional                                       |

Banco vazio mínimo:

```json
{
  "version": 1,
  "routines": [],
  "workouts": [],
  "active": null
}
```

## Planejamento e snapshots

`Workout` aceita três campos opcionais de ordem (`src/exerciseOrder.ts`): `orderChecks` com pares `{ beforeId, afterId, confirmed: null | boolean }` da própria sessão; `previousOrder` com `{ workoutId, changes }`, cópia dos pares confirmados do último treino da rotina, incluindo IDs e nomes dos dois exercícios; e `orderNoticesSeen`, IDs cujos avisos já foram fechados nesta sessão. `null` conserva uma pergunta pendente, `false` registra recusa e `true` confirma a inversão. O parser valida referências, ordem relativa dos checks, decisões, unicidade dos pares e avisos vistos; o backup preserva todos. Campos ausentes em bancos v1 antigos são aceitos, sem inferir a ordem passada a partir da posição ou dos campos preenchidos. Não muda a chave/versão do banco.

`Routine` tem `id`, `name`, `note`, `exercises`, `updatedAt` e os campos opcionais `weekdays`/`division`. Uma divisão é o agrupamento `{ id, name }` repetido nas suas rotinas; o conjunto usa `routineIds` e pode reunir rotinas de várias divisões ou avulsas.

`PlannedExercise` tem `id`, `name` e `reps: string[]`, com descanso opcional `rests: string[]` e vínculos `muscles`. Uma posição representa uma série. Descanso vazio significa não definido; zero significa nenhum descanso. Vínculos internos usam `{ nodeId, role }` com `primary`/`secondary`, diferentes dos nomes em português do formato de importação.

`Workout` copia nome, exercícios, metas, descansos e vínculos ao iniciar. Guarda `routineId`, `startedAt`, `finishedAt?` e `bodyWeight?`. Cada `LoggedSet` tem `target`, `reps`, `weight`, `done` e `rest?`. As sessões não dependem do planejamento atual para descrever o que foi feito.

Cada `LoggedExercise` aceita `loadAdjustment?: 'increase' | 'maintain' | 'decrease'` e `cramp?: boolean`. São lembretes daquela execução, independentes dos campos do planejamento. Ausência significa sem marcação e mantém bancos/backups v1 antigos compatíveis; o parser valida os campos presentes. Os lembretes são preservados em sessões ativas, finalizadas e backups, mas não são copiados como escolhas da nova sessão. A interface consulta o último treino da mesma rotina/exercício para mostrar os ícones anteriores no cabeçalho do exercício, uma única vez. Não há mudança da chave ou da versão do banco.

`CardioRun` e `CardioSession` também copiam as etapas. `elapsedMs` e `runningSince` permitem derivar o progresso pelo relógio real. `Supplement.takenOn` usa datas locais `YYYY-MM-DD`; `reminderTime` é opcional em `HH:mm`. Não converta os dias registrados para outro fuso ao viajar.

Valores numéricos de formulários são strings para permitir rascunhos e vírgula decimal. Metas de repetições vão de 1 a 999; cargas de 0 a 9999 kg; peso corporal maior que 0 até 999 kg; descansos de 0 a 3600 segundos ou vazio. Limites de cardio e importação estão nos guias específicos.

## Fluxo de escrita e restauração

Gravações normais e restaurações entram na mesma fila serial, evitando que um snapshot antigo termine depois e sobrescreva o mais novo. Ao passar para segundo plano, o app também solicita persistência. A escrita é assíncrona e não garante proteção absoluta contra desligamento durante a operação.

Na restauração, `App.tsx` suspende mutações/autosave. O armazenamento espera a fila, lê o valor anterior, grava o novo JSON e confere a leitura. Se falhar, tenta repor e conferir o anterior. A memória só recebe o banco restaurado após sucesso. Erros de leitura não são tratados apagando os dados.

Após gravar/carregar, o app refaz projeções mínimas para widgets e lembretes. Elas são caches privados nativos, não outro banco principal. Falha de sincronização acessória não desfaz uma gravação do banco bem-sucedida.

## Formatos externos e limites

| Entrada                | Contrato                                                      | Efeito                                                            |
| ---------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| Planejamento por texto | `ritmo/1`; raiz com `formato`                                 | Acrescenta rotinas/divisões/cardios; preserva histórico e sessões |
| Backup completo        | `ritmo-backup/1`; raiz com `format`, `exportedAt`, `database` | Substitui o banco após validação, prévia e confirmação            |
| Armazenamento interno  | `Database.version: 1`                                         | Snapshot completo na chave do AsyncStorage                        |

Não intercambie os formatos. A importação cria IDs internos novos e recusa chaves desconhecidas, duplicatas de nomes e vínculos inválidos. A validação do banco confere o conteúdo completo e preserva dados inválidos para investigação.

O parser de força recusa IDs vazios e repetidos: rotinas no planejamento, sessões no histórico, exercícios dentro de cada rotina/sessão e séries dentro de cada exercício registrado. IDs de exercícios podem reaparecer em snapshots de sessões diferentes ou em outra rotina; esse vínculo histórico é preservado. Não há deduplicação automática nem alteração dos IDs ao ler/restaurar.

Planejamento salvo precisa ter nomes, pelo menos um exercício e de 1 a 20 séries por exercício, com metas inteiras de 1 a 999. Sessões também exigem exercícios/séries e metas válidas. Repetições e cargas de séries pendentes continuam aceitando rascunhos; somente séries concluídas exigem valores válidos. Campos opcionais ausentes de bancos v1 antigos permanecem aceitos. Dados malformados são recusados sem apagar o conteúdo persistido; não há mudança de versão ou chave do banco.

- Banco serializado para escrita/restauração: **1.500.000 bytes UTF-8** (`src/backupLimits.ts`).
- Arquivo escolhido para restauração: **8.000.000 bytes**; no Android, leitura limitada do `content://` original sem cópia automática para cache.
- Texto `ritmo/1`: **100.000 caracteres**, até 20 divisões e 50 rotinas somando força/cardio.
- Serialização/parser de backup: teto adicional de **10.000.000 caracteres** (`src/backup.ts`). O limite de bytes do seletor/banco continua sendo aplicado na restauração.

Exportação permite preservar dados legados acima do teto de armazenamento quando couberem no limite de exportação. Eles podem exigir redução ou migração para serem restaurados. O arquivo permanece JSON legível, sem criptografia própria.

## Evoluir o esquema

`LoggedSet.longRest?: boolean` registra descanso maior que o recomendado antes da série; `LoggedSet.restPause?: boolean` registra a pausa breve de cerca de 5 a 10 segundos durante a execução; `LoggedSet.cramp?: boolean` registra cãibra naquela série. São campos independentes e opcionais: ausência equivale a desmarcado. O parser exige booleanos quando presentes, no treino ativo e no histórico. Finalização, retomada e backup preservam as marcações; iniciar outra sessão não as copia do histórico. Não há mudança de versão ou chave do banco, nem alteração do planejamento ou dos registros antigos. `LoggedExercise.cramp` permanece um impedimento legado do exercício inteiro, sem distribuição automática entre séries.

Os campos opcionais acrescentados ao banco v1 mantêm a leitura dos registros antigos. Teste esse comportamento antes de mudar tipos ou parser. Mudanças de versão/chave/formato que quebrem a leitura exigem migração explícita e testes; nunca resete o banco como solução genérica de erro. IDs musculares persistidos e IDs que ligam rotinas/exercícios/sessões devem continuar estáveis.

## Observações e impedimentos do exercício

`PlannedExercise.note?: string` e `LoggedExercise.note?: string` guardam texto livre de até 300 caracteres. O início copia a observação planejada. `setActiveExerciseNote` altera explicitamente a sessão atual e o exercício correspondente no planejamento por IDs, preservando o histórico, as séries e outras rotinas. Editar a nota no planejamento não reescreve um treino ativo. A importação `ritmo/1` aceita `nota` opcional em cada exercício; backups incluem os dois campos.

`LoggedExercise.cramp` mantém o significado anterior de **Impedimento** para todo o exercício, incluindo cansaço, cãibra e outras dificuldades. É preservado nos registros antigos e nas regras legadas, sem novo controle para marcá-lo. Novas cãibras usam `LoggedSet.cramp`, por série, com as mesmas ressalvas visuais das outras marcações de execução. `LoggedExercise.externalImpediment?: boolean` representa situações externas e bloqueia as sugestões automáticas enquanto a sessão estiver entre as duas comparadas. Todos os novos campos são opcionais; bancos v1 anteriores sem esses campos continuam válidos, sem limpeza ou migração destrutiva.
