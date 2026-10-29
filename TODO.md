# TODO

## Ordem dos exercícios — pedido em 19/10/2026

- [x] **Detectar mudança na ordem dos exercícios — implementado em 22/10/2026.**
  - Ao concluir a primeira série de A, perguntar por cada exercício B posterior no cadastro que já esteja inteiramente concluído. Confirmar/recusar cada par separadamente.
  - No próximo treino, avisar na primeira consulta de cada exercício envolvido; símbolos amarelos de retorno em U opostos, um por par, permitem reabrir a explicação. Sem alterar o cadastro ou as cargas. Evidências e situação do APK em `docs/ESTADO.md`.

## Atalhos da aba Rotinas — 2026-10-13

- [x] Reunir os seis atalhos em uma grade com três por linha, mantendo Nova divisão separada.
- [x] Usar braço flexionado em Cobertura, batimento em Cardio e robô em Importar; preservar os ícones de Pausar, Backup e Conjuntos.
- [x] Confirmar a pausa do planejamento de força em modal antes de aplicar.

## Impedimentos, observações e sugestões — 2026-10-13

- [x] Exibir observação somente no cabeçalho durante o treino, com lápis e modal de edição; salvar explicitamente ou cancelar o rascunho.

- [x] Generalizar Cãibra para Impedimento e adicionar Impedimento externo, independente.
- [x] Distinguir sugestões automáticas por triângulo único: verde para subir, vermelho para baixar.
- [x] Sugerir redução após maioria abaixo de metade da meta em cada um dos dois últimos treinos; impedimento externo invalida a comparação.
- [x] Guardar observações livres por exercício no editor e na execução, preservando snapshots antigos e aceitando nota na importação.

## Execução e lembretes — concluído em 2026-10-13

- [x] Priorizar o exercício atual e abrir o gráfico em modal pelo botão de expansão.
- [x] Registrar aumentar/manter/diminuir carga e cãibra por exercício; mostrar ícones no cabeçalho do exercício no próximo treino e no histórico.
- [x] Mostrar repetições e carga anteriores da série ao lado da meta.
- [x] Indicar progressão após dois treinos com as mesmas cargas e todas as metas atingidas; respeitar lembretes de manter/diminuir/cãibra.

## Gráficos padrão — concluído em 2026-10-05

- [x] Exibir peso corporal × data por padrão na aba Gráficos, usando os pesos informados ao finalizar treinos.
- [x] Exibir esforço relativo × data como segundo gráfico padrão. Esforço = soma de carga × repetições das séries concluídas; percentual inteiro = parte de cada sessão em relação ao maior esforço histórico da mesma rotina e fase de planejamento (ex.: 1.000/1.500 = 66%). IDs de rotina diferentes nunca são reunidos, mesmo com o mesmo nome. Mudanças de exercícios ou metas abrem outra fase; nome, descanso e observações não. Cores e rótulos identificam essas fases também no histórico.
- [x] Adicionar período comum aos dois gráficos padrão: 30 dias, 90 dias (inicial), 1 ano e tudo. O filtro não altera o máximo histórico usado para normalizar.

## Widgets compactos — proposta aprovada em 2026-10-03

- [x] **Adotar a versão compacta nos widgets Android de treinos e suplementos.**
  - O usuário escolheu a proposta visual **01 · Faixas compactas**, implementada em 2026-10-03.
  - Referência visual local, fora do Git: `../output/widget-propostas-20261003/01-faixas-compactas.png`. A imagem é conceitual e usa dados fictícios; a descrição abaixo permite retomar a tarefa mesmo sem esse arquivo.
  - Manter dois widgets independentes em faixas horizontais baixas, com alvo de **4×1 células cada**, sujeito à validação no launcher e com fonte ampliada. Preservar a paleta clara com verde escuro e pequenos destaques verde-lima.
  - **Treinos:** cabeçalho discreto `ritmo. · Treinos`, contagem de concluídos/previstos e nome do treino pendente em destaque. Usar indicador de estado pequeno no lugar da carinha grande. Os nomes da imagem são ilustrativos; não inferir grupos musculares pelo nome da rotina.
  - **Suplementos:** cabeçalho discreto `ritmo. · Suplementos`, contagem de registrados/total e resumo `Faltam: …` com os nomes pendentes. Retirar as sequências de dias da apresentação compacta.
  - Remover a data, os títulos genéricos e os rodapés explicativos do compacto. Para vários itens ou nomes longos, priorizar o primeiro pendente e resumir os restantes com `+N`, preservando a legibilidade.
  - Prever mensagens curtas para conclusão, dia sem treino e ausência de programação/cadastro, mantendo as regras atuais de contagem e conclusão. Preservar a abertura do app pelo widget de treinos e da aba de suplementos pelo respectivo widget.
  - Ajustar os limites de tamanho e a composição ao redimensionar; reduzir conteúdo e espaços antes de reduzir fontes. Manter áreas de toque adequadas e evitar elementos que pareçam caixas de confirmação sem essa função.
  - As propostas 02 e 03, o registro direto de suplementos e ações novas como retomar treino pelo widget não fazem parte desta escolha.
  - Validados no Android com nomes longos, múltiplas pendências, estados concluídos/vazios, fonte ampliada e redimensionamento horizontal; novo APK gerado. Em 2026-10-04, ambos ganharam o cartão vertical 1×2, com resumo oculto em 1×1 e redimensionamento nos dois eixos; entrega 1.0.5, build 7.

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
