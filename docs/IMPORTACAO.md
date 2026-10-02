# Importação de rotinas por texto — formato `ritmo/1`

Esta é a especificação para enviar a uma LLM. Peça: **“Leia a especificação abaixo e gere somente um JSON válido no formato `ritmo/1` para o plano que eu descrever. Não escreva comentários, Markdown ou explicações. Não invente campos nem IDs musculares.”** O app também oferece **Copiar instruções para IA**, que inclui as regras e o catálogo completo de IDs.

No app: **Rotinas → Importar treinos por texto → colar JSON → Conferir texto → Importar rotinas da prévia → confirmar**. O botão **Entender a gramática** abre uma explicação dos campos na própria tela; **Ver exemplo do formato** mostra um JSON completo, e **Copiar instruções para IA** copia a especificação para a área de transferência. A conferência aponta o caminho do campo inválido, por exemplo `divisoes[0].treinos[1].exercicios[2].repeticoes[0]`. Qualquer erro cancela o lote inteiro. Uma cerca de código Markdown marcada como `json` é aceita ao colar, embora a saída pedida à LLM seja só o JSON.

## Gramática

Use JSON padrão, com aspas duplas nos nomes das propriedades e strings; números não levam aspas. O objeto raiz contém `"formato": "ritmo/1"` e pelo menos uma lista não vazia entre `divisoes`, `treinos` e `cardios`. As três listas podem coexistir e são opcionais separadamente. Campos não documentados são rejeitados.

| Trecho                      | Significado                                                                                                                                                                                         |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `divisoes`                  | Lista de divisões novas. Cada item tem `nome` e `treinos` (lista não vazia).                                                                                                                        |
| `treinos` na raiz           | Lista de treinos de força avulsos, fora de uma divisão.                                                                                                                                             |
| `treinos` dentro da divisão | Treinos de força agrupados naquela divisão.                                                                                                                                                         |
| Treino `nome`               | Nome exibido no planejamento; obrigatório, até 80 caracteres.                                                                                                                                       |
| Treino `dias`               | Lista opcional de `seg`, `ter`, `qua`, `qui`, `sex`, `sab`, `dom`, sem repetição. Ausência ou `[]` significa livre.                                                                                 |
| Treino `nota`               | Observação opcional, até 300 caracteres.                                                                                                                                                            |
| Treino `exercicios`         | Lista não vazia de exercícios, no máximo 50 por treino.                                                                                                                                             |
| Exercício `nome`            | Nome obrigatório, até 80 caracteres.                                                                                                                                                                |
| Exercício `repeticoes`      | Metas de cada série, em ordem; lista de 1 a 20 inteiros de 1 a 999. Exemplo `[12, 10, 8]` representa três séries.                                                                                   |
| Exercício `descanso`        | Opcional. Inteiro de 0 a 3600 segundos aplicado a todas as séries, ou lista de inteiros com o mesmo comprimento de `repeticoes`. Zero é um descanso explícito.                                      |
| Exercício `musculos`        | Opcional. Lista de `{ "id": ID, "papel": "principal" ou "secundario" }`; cada ID só pode aparecer uma vez por exercício. Aceita grupos amplos e músculos/porções específicos. Se não souber, omita. |
| `cardios`                   | Lista de rotinas de cardio, cada uma com `nome`, `dias` opcional e `etapas`.                                                                                                                        |
| Cardio `etapas`             | Lista de 1 a 50 objetos `{ "minutos": número, "velocidade": número }`. Minutos: 0,1 a 60; velocidade: 0 a 40 km/h; total: até 4 horas.                                                              |

Uma importação aceita até 20 divisões e 50 rotinas somando treinos e cardios; o texto pode ter até 100.000 caracteres. Nomes de divisões, treinos no mesmo local e cardios não podem repetir nomes existentes ou nomes do próprio lote (comparação sem diferença entre maiúsculas e acentos). A importação **acrescenta** planejamento e não substitui rotinas anteriores, sessões ativas ou histórico. Não inclua carga/peso: esses valores são registrados na execução, não no planejamento.

## Exemplo válido

```json
{
  "formato": "ritmo/1",
  "divisoes": [
    {
      "nome": "ABC",
      "treinos": [
        {
          "nome": "A - Peito",
          "dias": ["seg", "qui"],
          "nota": "Progredir com boa técnica.",
          "exercicios": [
            {
              "nome": "Supino reto",
              "repeticoes": [12, 10, 8],
              "descanso": [60, 90, 120],
              "musculos": [
                { "id": "chest", "papel": "principal" },
                { "id": "triceps", "papel": "secundario" }
              ]
            }
          ]
        }
      ]
    }
  ],
  "treinos": [
    {
      "nome": "Mobilidade livre",
      "exercicios": [{ "nome": "Agachamento livre", "repeticoes": [12, 12], "descanso": 60 }]
    }
  ],
  "cardios": [
    {
      "nome": "HIIT na esteira",
      "dias": ["ter", "sab"],
      "etapas": [
        { "minutos": 1, "velocidade": 5 },
        { "minutos": 1, "velocidade": 8 },
        { "minutos": 0.5, "velocidade": 12 }
      ]
    }
  ]
}
```

## IDs musculares aceitos

Use o ID à esquerda, não o nome. Um grupo amplo expressa incerteza; escolher um filho específico não preenche os irmãos. A lista abaixo acompanha `src/muscles.ts` nesta versão do app.

```text
chest — Peitoral
pectoralis-major — Peitoral maior
pectoralis-clavicular — Peitoral maior · porção clavicular
pectoralis-sternocostal — Peitoral maior · porção esternocostal
pectoralis-minor — Peitoral menor
shoulders — Ombros / deltoides
deltoid-anterior — Deltoide anterior
deltoid-lateral — Deltoide lateral
deltoid-posterior — Deltoide posterior
cuff — Manguito rotador
supraspinatus — Supraespinal
infraspinatus — Infraespinal
teres-minor — Redondo menor
subscapularis — Subescapular
lats — Dorsais
latissimus — Latíssimo do dorso
teres-major — Redondo maior
trapezius — Trapézio
trapezius-upper — Trapézio superior
trapezius-middle — Trapézio médio
trapezius-lower — Trapézio inferior
scapular — Romboides e elevador da escápula
rhomboid-major — Romboide maior
rhomboid-minor — Romboide menor
levator-scapulae — Elevador da escápula
serratus — Serrátil
serratus-anterior — Serrátil anterior
elbow-flexors — Bíceps e flexores do cotovelo
biceps — Bíceps braquial
brachialis — Braquial
brachioradialis — Braquiorradial
triceps — Tríceps
triceps-long — Tríceps · cabeça longa
triceps-lateral — Tríceps · cabeça lateral
triceps-medial — Tríceps · cabeça medial
forearms — Antebraços
flexor-carpi-radialis — Flexor radial do carpo
flexor-carpi-ulnaris — Flexor ulnar do carpo
flexor-digitorum — Flexor superficial dos dedos
extensor-carpi-radialis — Extensor radial longo do carpo
extensor-carpi-ulnaris — Extensor ulnar do carpo
extensor-digitorum — Extensor dos dedos
pronator-teres — Pronador redondo
supinator — Supinador
abs — Abdômen
rectus-abdominis — Reto abdominal
external-oblique — Oblíquo externo
internal-oblique — Oblíquo interno
transversus — Transverso do abdômen
spinal — Paravertebrais e lombar
iliocostalis — Iliocostal
longissimus — Longuíssimo
spinalis — Espinal
multifidus — Multífidos
quadratus-lumborum — Quadrado lombar
glutes — Glúteos
gluteus-maximus — Glúteo máximo
gluteus-medius — Glúteo médio
gluteus-minimus — Glúteo mínimo
quads — Quadríceps
rectus-femoris — Reto femoral
vastus-lateralis — Vasto lateral
vastus-medialis — Vasto medial
vastus-intermedius — Vasto intermédio
hamstrings — Posteriores da coxa
biceps-femoris — Bíceps femoral
semitendinosus — Semitendíneo
semimembranosus — Semimembranáceo
adductors — Adutores
adductor-magnus — Adutor magno
adductor-longus — Adutor longo
adductor-brevis — Adutor curto
gracilis — Grácil
pectineus — Pectíneo
hip-flexors — Flexores do quadril
psoas-major — Psoas maior
iliacus — Ilíaco
sartorius — Sartório
tensor-fasciae — Tensor da fáscia lata
calves — Panturrilhas
gastrocnemius — Gastrocnêmio
soleus — Sóleo
lower-leg — Tibiais e fibulares
tibialis-anterior — Tibial anterior
tibialis-posterior — Tibial posterior
fibularis-longus — Fibular longo
fibularis-brevis — Fibular curto
neck — Pescoço
sternocleidomastoid — Esternocleidomastóideo
splenius-capitis — Esplênio da cabeça
scalene-anterior — Escaleno anterior
```
