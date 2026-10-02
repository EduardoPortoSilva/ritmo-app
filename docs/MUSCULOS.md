# Catálogo e cobertura muscular

## Escopo e fontes

O catálogo local de `src/muscles.ts` organiza grupos práticos de musculação, músculos e porções em uma árvore de IDs estáveis. Não é uma lista exaustiva de todos os músculos esqueléticos nem um sistema de recomendação de exercícios. Nomes e relações anatômicas usam como referência o livro **Anatomy and Physiology 2e**, OpenStax / Rice University:

- [Cabeça, pescoço e coluna](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back).
- [Parede abdominal e tórax](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-4-axial-muscles-of-the-abdominal-wall-and-thorax).
- [Cintura escapular e membros superiores](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs).
- [Cintura pélvica e membros inferiores](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs).

Os agrupamentos da interface são escolhas de organização: músculos podem ter várias funções, mas cada item tem um único caminho no catálogo para evitar duplicidade. Não há atribuição automática de músculos por nome do exercício, percentuais de ativação, metas mínimas de séries ou nota de qualidade do treino. Os vínculos são informados pelo usuário.

## Vínculos e persistência

`PlannedExercise.muscles?: { nodeId, role }[]` aceita grupos, músculos e porções juntos. `role` é `primary` ou `secondary`; cada `nodeId` pode aparecer uma única vez no exercício. IDs desconhecidos, estruturas inválidas e papéis inválidos são recusados na validação, sem apagar dados. `muscleLinksKey` normaliza a ordem e trata ausência como lista vazia na detecção de alterações reais.

Os vínculos pertencem ao exercício daquela rotina; nomes iguais não compartilham classificação automaticamente. São gravados ao salvar a rotina ou divisão. `startWorkout` copia cada vínculo para o exercício registrado, mantendo os snapshots independentes do planejamento. Banco v1, histórico antigo e treino ativo sem classificação continuam válidos. Editar uma rotina não preenche nem modifica retroativamente sessões anteriores.

## Regras de cobertura

- A análise é do planejamento: rotina individual ou todos os treinos da divisão, uma vez cada. Dias da semana não multiplicam as séries.
- Um vínculo específico contribui para o resumo dos seus ancestrais. O inverso não ocorre: vincular Peitoral não informa automaticamente músculos ou porções filhos.
- `muscleCoverage` reúne os vínculos do nó e seus descendentes, contando cada exercício uma vez nessa seleção. Se houver papéis principal e secundário dentro dela, principal prevalece; os vínculos originais continuam detalhados na tela.
- Contagens principais e secundárias permanecem separadas. Não somar as contagens de todas as regiões como se fossem séries únicas do treino: a mesma série pode envolver regiões diferentes.
- A contagem de regiões indica presença de algum vínculo, nunca completude anatômica ou estímulo suficiente. Exercícios sem vínculos tornam a análise parcial e aparecem explicitamente como pendentes.
- Ao selecionar um filho que só tem vínculo em um ancestral, mostrar “grupo informado; detalhe não especificado”, sem atribuir séries ao filho.

## Desenho e interação

`src/bodyMapData.ts` contém caminhos vetoriais originais e esquemáticos, desenhados para este app; não são reproduções das imagens das fontes. `bodyRegions` associa todos os grupos a áreas de frente/costas. `bodyDetails` fornece contornos específicos quando representáveis nessa escala, incluindo as porções peitorais, deltoides, reto femoral e vastos lateral/medial. `bodySurface` e `bodySurfaceLines` acrescentam planos e linhas anatômicas decorativas nas duas vistas, inclusive nas áreas sem vínculo, sem mudar IDs ou regiões de toque. Demais músculos usam projeções aproximadas na região do grupo, sem inventar contornos anatômicos individuais. Músculos profundos também usam projeções. O desenho representa os dois lados juntos; não há lateralidade cadastrada.

`BodyMap` usa `react-native-svg` 15.15.4, instalada na versão compatível com [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/svg/). Verde indica principal; ocre, secundário; cinza, ausência de vínculo. Listras distinguem vínculos amplos; pontos distinguem projeções aproximadas. Áreas amplas são desenhadas antes das específicas. Toques no mapa selecionam a região e levam ao detalhe; a lista pesquisável oferece a mesma navegação com alvos maiores e rótulos acessíveis. As cores não indicam intensidade ou ativação fisiológica.

Entrada pela aba Rotinas, consulta de rotina ou consulta de divisão. `CoverageScreen` mostra seleção, mapa, detalhes, árvore e exercícios sem classificação. `MusclePicker` reutilizado pelo editor avulso e de divisão permite busca sem acentos, detalhamento da árvore, escolha de papel e remoção. A lista de resultados tem rolagem própria para manter o formulário utilizável. O botão `?` do exercício abre `ExerciseMuscleModal` na edição, consulta da rotina, execução e histórico. Ele mostra frente e costas, os vínculos daquele exercício com seus papéis, permite explorar os níveis da árvore e explica quando um grupo amplo não especifica um músculo filho. Exercícios antigos sem vínculos mostram o mapa sem destaques e uma orientação para vinculá-los no editor. O modal não altera dados; na execução e no histórico, usa os vínculos copiados ao iniciar aquela sessão.

Ao ampliar a base, preserve os IDs já persistidos, confira relações e fontes, garanta localização para novos grupos e valide as projeções. O mapa não substitui um atlas anatômico e essa limitação aparece na interface. A nova dependência SVG exige um APK recompilado; exportar o bundle Android não atualiza o APK instalado.
