# Backup e assinatura Android

## Dados do usuário

Em **Rotinas > Backup e restauração**, **Exportar backup para arquivo** salva um JSON `ritmo-backup/1` com o banco inteiro: planejamento, conjuntos, sessões e históricos de força e cardio, pesos e suplementos. No Android, escolha uma pasta pelo seletor do sistema. O app lê o arquivo de volta e só então informa sucesso. Guarde uma cópia fora do celular antes de desinstalar ou trocar de aparelho. O arquivo é legível e não tem senha; trate-o como dado pessoal.

**Escolher arquivo de backup** valida formato e dados e mostra a data e as contagens antes de restaurar. **Restaurar este backup** pede confirmação e substitui todo o banco local. Faça uma exportação dos dados atuais antes se quiser poder voltar. A restauração grava o banco antes de atualizar a tela e os widgets/lembretes; falha nesses recursos acessórios não desfaz a gravação.

A restauração bloqueia novas gravações enquanto troca o banco, espera gravações antigas da fila e relê exatamente o JSON salvo antes de anunciar sucesso. Se a escrita ou conferência falhar, tenta repor e conferir o banco anterior. Uma falha também na reposição exige preservar o arquivo e investigar antes de desinstalar. O banco serializado aceito para restauração tem limite de 1.500.000 bytes UTF-8 por ser uma entrada única do AsyncStorage Android; gravações normais usam o mesmo teto e mostram erro sem apagar o estado em memória. Dados legados acima do teto podem ser exportados para preservar uma cópia, mas precisam ser reduzidos ou migrados para voltar a ser importados.

No Android, o seletor abre o `content://` original sem copiá-lo para o cache. A leitura ocorre em blocos de 64 KiB e para em 8.000.000 bytes; o arquivo escolhido não é alterado. Na web, o tamanho é conferido antes de ler. No iOS, a cópia do seletor ainda é necessária e esse fluxo não foi validado nesta entrega Android.

O backup automático do Android está desligado (`allowBackup=false` e exclusões explícitas dos nove domínios de dados em nuvem e transferência entre aparelhos). Sem exportação manual, desinstalar o app pode apagar definitivamente os dados. O backup JSON não é enviado pelo Ritmo à nuvem. O usuário pode escolher uma pasta sincronizada por outro aplicativo; isso fica fora do controle do Ritmo.

## APK assinado

O `android/` é gerado e ignorado. `app.json` registra `plugins/withRitmoAndroidSecurity.js`, que coloca as regras de backup e substitui a assinatura release do template Expo por `ritmoRelease`. Qualquer tarefa Gradle com `release` falha se a chave e as quatro variáveis de assinatura não estiverem presentes. Builds debug continuam usando a chave de desenvolvimento. Não altere somente os arquivos gerados em `android/`.

No Windows, execute a partir da raiz do repositório (a pasta `mobile/` no workspace original):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\create-release-key.ps1
npx.cmd expo prebuild --platform android --no-install
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-release.ps1
```

O primeiro comando é executado uma única vez. A chave privada e as credenciais ficam em `.tools/signing/`, ignorado pelo Git. A pasta local tem ACL NTFS restrita à conta que criou a chave; outras contas comuns não podem ler o JSON ou o JKS. Guarde **ambos os arquivos** em um cofre ou mídia segura fora do workspace, pois a perda da chave impede atualizações. O JSON contém a senha em texto claro para essa conta; proteja também o backup externo. Não publique a pasta nem o JSON de backup. Sem a mesma chave, o Android não aceita atualização de um APK já instalado. Se o usuário tinha uma versão assinada pela chave pública do template, é necessário exportar os dados naquela versão antes de trocar de assinatura, pois a instalação direta será recusada.

O APK sai em `android/app/build/outputs/apk/release/app-release.apk`. Verifique-o com `apksigner verify --print-certs`, compare o certificado com a referência privada e examine o manifesto (`allowBackup=false` e regras XML) antes de copiar para `../entrega/`. O `versionCode` da entrega de 02/10/2026 é 4. Incremente-o em cada nova entrega.
