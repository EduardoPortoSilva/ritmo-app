# TODO

## Ordem sugerida de execução — 2026-09-28

1. **Pausa e estado vazio do planejamento de força — concluído.** Há ação direta para pausar/retomar; os textos distinguem força, cardio e histórico e contextualizam o conjunto vazio.
2. **Validação nativa da importação — concluída.** JSON inválido não foi salvo; um lote com divisão e cardio foi importado em AVD de teste.
3. **Modal de músculos por exercício — concluído.** Disponível na edição, consulta, execução e histórico do exercício.

**Sem data de execução:** remover “Inicial pra testar” somente quando o usuário indicar que terminou os testes ou pedir a remoção. A pausa proposta acima não inclui cardio; a decisão sobre pausar cardios fica separada, conforme o feedback.

- [ ] **Remover a rotina de exemplo “Inicial pra testar” após os testes.**
  - Registrada a pedido do usuário em 2026-09-16; sem prazo definido.
  - Em 2026-09-27, o usuário pediu para ignorar esta pendência por enquanto; retomar somente quando ele solicitar.
  - A rotina foi cadastrada nos dados locais do app Ritmo (`com.ritmo.treinos`) no AVD, não no código-fonte nem como conteúdo padrão do APK.
  - Contém Supino reto, Remada baixa e Leg press, cada um com 3 séries de 12 repetições.
  - Manter disponível enquanto o usuário testa. Fazer a limpeza quando ele indicar que terminou ou solicitar a remoção.
  - Excluir somente essa rotina pela interface, preservando outras rotinas e o histórico. Não limpar os dados do app nem resetar o AVD.
  - Marcar esta tarefa como concluída após verificar que a rotina foi removida.

## Melhorias aprovadas após o teste ABC — 2026-09-26

Os quatro itens iniciais foram implementados em 2026-09-26. O cadastro da divisão em uma única tela foi implementado em 2026-09-27. Validações e situação do APK descritas em [estado e validação](docs/ESTADO.md).

- [x] **Avisar sobre alterações não salvas somente quando houver mudanças.**
  - Abrir o editor apenas para consultar e sair sem alterar dados não deve exibir o aviso.
  - Manter a confirmação quando houver alterações não salvas.

- [x] **Cadastrar e exibir o descanso junto ao exercício.**
  - Evitar depender das observações gerais da rotina para informar o descanso.
  - Permitir um descanso comum por padrão e valores diferentes por série, conforme a necessidade do usuário.

- [x] **Facilitar o preenchimento de repetições e descansos iguais entre séries, preservando ajustes individuais.**
  - Oferecer preenchimento comum ou aplicação a todas as séries do exercício.
  - O padrão pode ser igual para todas as séries, mas cada série deve continuar permitindo sua própria quantidade de repetições e seu próprio descanso.
  - Exemplo a preservar: repetições 12/10/8 e descansos 60/90/120 segundos no mesmo exercício.
  - Aplicar um valor comum deve ser uma ação explícita; editar uma série individualmente não deve sobrescrever as demais.

- [x] **Facilitar a conferência do treino recém-salvo sem entrar em edição.**
  - Ao salvar, mostrar ou destacar a rotina correspondente, evitando retornar sempre ao topo da lista e ocultar o item recém-salvo.
  - Permitir consultar exercícios, séries e suas repetições em modo de leitura, incluindo metas diferentes entre séries.

- [x] **Cadastrar uma divisão em uma única tela, com uma seção por treino.**
  - Aprovação posterior do usuário no mesmo roteiro ABC: criar o conjunto e seus treinos na mesma tela.
  - Cada seção contém nome, dias da semana e exercícios do treino.
  - Permitir adicionar treinos e recolher seções concluídas, mantendo um resumo visível.
  - Salvar a divisão com seus treinos; repetições e descansos continuam ajustáveis por série.
  - Implementado em 2026-09-27: Nova divisão na aba Rotinas, seções recolhíveis, salvamento do conjunto e consulta/edição da divisão. Rotinas avulsas continuam disponíveis.

## Gráficos — pedidos após o teste de 2026-09-27

Implementação explicitamente autorizada e concluída em 2026-09-27, após o usuário esclarecer a fórmula de carga efetiva total. Código e fluxos web validados naquela entrega. No reteste posterior de 2026-09-27, o APK foi recompilado e instalado por atualização no AVD, com assinatura compatível e dados preservados; consulta dos três exercícios e totais conferida no Android. Evidências em `test-results/usabilidade-graficos-reteste-20260927/`.

- [x] **Criar uma tela com os gráficos de cargas.**
  - Permitir consultar e comparar a evolução dos exercícios sem iniciar uma sessão de treino.
  - Aba Gráficos com seleção de exercício por rotina, incluindo registros de rotinas excluídas.

- [x] **Adicionar a carga efetiva total como uma nova série no gráfico existente.**
  - Terceira linha no mesmo gráfico da carga máxima e das repetições, tanto durante o treino quanto na aba Gráficos.
  - Total em laranja pontilhado, com escala própria à direita em kg·repetições; carga e repetições mantêm a escala compartilhada à esquerda.
  - Definição esclarecida pelo usuário em 2026-09-27: `SUM(N_Reps * Carga_Reps)`, somando repetições realizadas × carga de cada série do exercício naquela sessão.
  - Considerar somente séries concluídas, seguindo a regra de volume já existente no app.
  - Exemplo: 12 × 20 kg + 10 × 25 kg + 8 × 30 kg = 730 kg·repetições.

## Cobertura muscular — 2026-09-27

- [x] **Base hierárquica de grupos, músculos e porções, com IDs estáveis e busca única.**
  - O usuário escolhe o nível por vínculo: por exemplo, Peitoral ou Vasto lateral.
- [x] **Vincular músculos principais e secundários aos exercícios.**
  - Cadastro no editor de rotina/divisão; vínculos opcionais e sem classificação automática por nome.
- [x] **Analisar rotina ou divisão com desenho do corpo de frente e costas.**
  - Diferenciar vínculo amplo, específico e ausência de classificação; séries planejadas sem dupla contagem dentro da mesma região.
  - Mapa esquemático interativo, com contornos específicos quando disponíveis e projeções aproximadas identificadas para os demais músculos.
  - Não interpretar vínculo amplo como cobertura completa dos músculos filhos nem como estímulo suficiente.
- [x] **Modal de músculos envolvidos por exercício.**
  - Desenho de frente e costas acessível pelo botão `?` do exercício, com vínculos principais e secundários, detalhes da região selecionada e estado vazio para exercícios sem classificação.

Fontes, escopo do catálogo e regras em [catálogo muscular](docs/MUSCULOS.md). Situação da validação e do APK em [estado e validação](docs/ESTADO.md).

## Conjuntos e rotinas antigas — 2026-09-28

- [x] **Guardar rotinas anteriores em conjuntos e alternar o planejamento ativo.**
  - O primeiro conjunto alternativo guarda automaticamente as rotinas já cadastradas em “Planejamento atual”.
  - Uma rotina pode pertencer a vários conjuntos; editar a rotina atualiza a mesma rotina em todos eles.
  - Somente o conjunto ativo aparece no planejamento, nos treinos de hoje e no widget de musculação.
  - Conjuntos inativos continuam disponíveis para reativação; alternar não apaga histórico ou treino em andamento.
  - Excluir um conjunto remove apenas seus vínculos, mantendo as rotinas e o histórico.
  - A tela **Conjuntos de rotinas** permite criar, editar, ativar e excluir conjuntos.

## Feedback do teste de conjuntos e importação — 2026-09-28

Evidências em `test-results/usabilidade-importacao-conjuntos-20260928/resultado.md`. A importação válida funcionou; os itens abaixo são melhorias ou verificações pendentes, não falhas confirmadas da gramática.

- [x] **Facilitar a pausa do planejamento de força atual.**
  - A aba Rotinas agora pausa e retoma o planejamento de força diretamente, sem trocar de conjunto ou excluir dados. A pausa persiste após reabrir o app; ativar outro conjunto retoma automaticamente a força.
- [x] **Esclarecer o alcance de “planejamento vazio” e da desativação.**
  - A interface informa que pausar oculta o planejamento de força e o widget correspondente; cardio, histórico e treino em andamento continuam disponíveis. Pausar cardios continua uma decisão separada.
- [x] **Contextualizar a mensagem “Criar minha primeira rotina”.**
  - Havendo rotinas guardadas em outro conjunto, a ação usa “Criar rotina neste conjunto” e o estado vazio descreve o conjunto atual.
- [x] **Ampliar o teste da importação por texto.**
  - No Android, um lote com cardio inválido foi recusado inteiro, sem salvar a divisão válida do mesmo lote. O lote corrigido mostrou prévia e importou divisão e cardio; ambos ficaram acessíveis.

## Achado do checkup limpo — 2026-09-29/30

- [x] **Tratar distância de cardio igual à esperada como igualdade na comparação.**
  - Com 0,04 km esperados e 0,04 km informados, a finalização e o detalhe do histórico mostraram `+0,00 km acima do esperado`.
  - Exibir uma mensagem neutra quando a diferença apresentada for zero, inclusive após arredondamento. Evidências em `test-results/checkup-limpo-20260929/33-cardio-distancia.png` e `35-cardio-historico-detalhe.png`.
  - Concluído em 2026-09-30 com tolerância de 0,01 km; detalhes em [estado e validação](docs/ESTADO.md).
