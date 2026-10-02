# Segurança e privacidade

O Ritmo guarda o banco localmente e não implementa backend, contas, sincronização ou telemetria própria. Isso não é uma garantia de criptografia do armazenamento: a proteção depende também do aparelho, do navegador e da conta de desenvolvimento.

## Dados e backup

O banco no AsyncStorage contém rotinas, séries, pesos, históricos, cardio e suplementos. Widgets/lembretes usam apenas projeções mínimas em caches privados Android. O app não solicita acesso a microfone, câmera, contatos ou localização para essas funções.

O backup automático Android está desativado por manifesto e regras explícitas de nuvem/transferência. O backup manual `ritmo-backup/1` é um JSON legível, sem criptografia ou senha próprias. Guarde-o privadamente fora do aparelho e exporte antes de desinstalar. Uma pasta escolhida pode ser sincronizada por outro aplicativo; essa sincronização não é feita pelo Ritmo.

A restauração valida o banco, mostra prévia e pede confirmação. Ela espera a fila de gravações, confere a escrita e tenta rollback conferido se houver falha. Limites de tamanho evitam leituras/gravações acima do aceito; consulte [Dados](docs/DADOS.md) e [Backup](docs/BACKUP-E-ASSINATURA.md). Erros não devem provocar limpeza automática do banco.

## Assinatura e arquivos privados

A assinatura release exige chave privada. `.tools/signing/`, JKS e `credentials.json` são locais e ignorados; o script de geração protege a pasta com ACL NTFS para a conta de desenvolvimento. O arquivo de credenciais contém a senha em texto claro para essa conta. Proteja também a cópia externa da chave/credenciais.

Nunca publique essas credenciais, tokens, arquivos `.env` ou backups pessoais. O Android exige a mesma chave para atualizar uma instalação. Perder a chave ou substituí-la afeta a continuidade da distribuição; o repositório não é o backup dessa chave.

O serviço de descanso Android é não exportado, tem duração limitada e libera foco de áudio/wake lock ao encerrar. Os lembretes usam alarmes não exatos. Ambos estão sujeitos às restrições do sistema; isso não permite prometer entrega infalível de avisos.

## Dependências e limites da validação

`package-lock.json` registra as versões usadas. Antes de uma nova distribuição, execute Expo Doctor e `npm audit`, analise a cadeia afetada e valide uma correção compatível com o SDK. Não aplique `npm audit fix --force` automaticamente.

A revisão local de 02/10/2026 registrou pendências transitivas nas ferramentas do Expo (`node-forge` e `uuid`) e divergência de patch do Expo Doctor. Esse é um resultado histórico, não uma consulta atual nem prova de exploração no APK. Detalhes do estado e limites em [Estado](docs/ESTADO.md); reavalie dependências antes de distribuir ou habilitar novas integrações.

iOS, aparelhos físicos e o comportamento audível com outros aplicativos não têm a mesma cobertura das verificações web/emulador. Não use essas verificações como certificação de segurança de todas as plataformas.

## Relatar uma falha

Este repositório ainda não define um canal público de segurança ou endereço de contato. Comunique-se privadamente com seu responsável por um canal já conhecido. Quando disponível no GitHub, use o canal de relato privado de vulnerabilidades do repositório. Evite abrir uma issue pública com credenciais, backups pessoais ou detalhes de exploração sensíveis.

Inclua versão/`versionCode`, plataforma, passos mínimos, resultado esperado/observado e exemplo sintético sem dados pessoais. Se uma credencial já foi publicada, avise o responsável e trate sua substituição antes de presumir que a remoção do arquivo resolveu o problema.
