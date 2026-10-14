# Modelo de dados e persistência

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

Os campos opcionais acrescentados ao banco v1 mantêm a leitura dos registros antigos. Teste esse comportamento antes de mudar tipos ou parser. Mudanças de versão/chave/formato que quebrem a leitura exigem migração explícita e testes; nunca resete o banco como solução genérica de erro. IDs musculares persistidos e IDs que ligam rotinas/exercícios/sessões devem continuar estáveis.

## Observações e impedimentos do exercício

`PlannedExercise.note?: string` e `LoggedExercise.note?: string` guardam texto livre de até 300 caracteres. O início copia a observação planejada. `setActiveExerciseNote` altera explicitamente a sessão atual e o exercício correspondente no planejamento por IDs, preservando o histórico, as séries e outras rotinas. Editar a nota no planejamento não reescreve um treino ativo. A importação `ritmo/1` aceita `nota` opcional em cada exercício; backups incluem os dois campos.

`cramp` mantém o nome persistido anterior, mas representa **Impedimento** na interface, incluindo cansaço, cãibra e outras dificuldades. `LoggedExercise.externalImpediment?: boolean` representa situações externas e bloqueia as sugestões automáticas enquanto a sessão estiver entre as duas comparadas. Todos os novos campos são opcionais; bancos v1 anteriores sem esses campos continuam válidos, sem limpeza ou migração destrutiva.
