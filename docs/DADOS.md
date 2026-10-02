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

- Banco serializado para escrita/restauração: **1.500.000 bytes UTF-8** (`src/backupLimits.ts`).
- Arquivo escolhido para restauração: **8.000.000 bytes**; no Android, leitura limitada do `content://` original sem cópia automática para cache.
- Texto `ritmo/1`: **100.000 caracteres**, até 20 divisões e 50 rotinas somando força/cardio.
- Serialização/parser de backup: teto adicional de **10.000.000 caracteres** (`src/backup.ts`). O limite de bytes do seletor/banco continua sendo aplicado na restauração.

Exportação permite preservar dados legados acima do teto de armazenamento quando couberem no limite de exportação. Eles podem exigir redução ou migração para serem restaurados. O arquivo permanece JSON legível, sem criptografia própria.

## Evoluir o esquema

Os campos opcionais acrescentados ao banco v1 mantêm a leitura dos registros antigos. Teste esse comportamento antes de mudar tipos ou parser. Mudanças de versão/chave/formato que quebrem a leitura exigem migração explícita e testes; nunca resete o banco como solução genérica de erro. IDs musculares persistidos e IDs que ligam rotinas/exercícios/sessões devem continuar estáveis.
