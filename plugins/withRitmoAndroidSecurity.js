const fs = require('node:fs');
const path = require('node:path');
const {
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
} = require('expo/config-plugins');

const excludedDomains = [
  'root',
  'file',
  'database',
  'sharedpref',
  'external',
  'device_root',
  'device_file',
  'device_database',
  'device_sharedpref',
];
const excludeRules = excludedDomains
  .map((domain) => `    <exclude domain="${domain}" path="." />`)
  .join('\n');
const backupRules = `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
${excludeRules}
</full-backup-content>
`;
const extractionRules = `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <cloud-backup>
${excludeRules}
  </cloud-backup>
  <device-transfer>
${excludeRules}
  </device-transfer>
  <cross-platform-transfer>
${excludeRules}
  </cross-platform-transfer>
</data-extraction-rules>
`;

function patchReleaseSigning(contents) {
  if (contents.includes('RITMO_RELEASE_SIGNING')) return contents;
  const signingConfigs = contents.indexOf('    signingConfigs {');
  const buildTypes = contents.indexOf('    buildTypes {', signingConfigs);
  const release = contents.indexOf('        release {', buildTypes);
  const debugSigning = contents.indexOf('signingConfig signingConfigs.debug', release);
  if (signingConfigs < 0 || buildTypes < 0 || release < 0 || debugSigning < 0)
    throw new Error('Não foi possível localizar a assinatura release no Gradle gerado.');

  const setup = `// RITMO_RELEASE_SIGNING: never sign release builds with the Expo template key.
def ritmoStorePath = System.getenv('RITMO_SIGNING_STORE_FILE')
def ritmoStorePassword = System.getenv('RITMO_SIGNING_STORE_PASSWORD')
def ritmoKeyAlias = System.getenv('RITMO_SIGNING_KEY_ALIAS')
def ritmoKeyPassword = System.getenv('RITMO_SIGNING_KEY_PASSWORD')
if (gradle.startParameter.taskNames.any { it.toLowerCase().contains('release') } &&
    (!ritmoStorePath || !file(ritmoStorePath).isFile() || !ritmoStorePassword || !ritmoKeyAlias || !ritmoKeyPassword)) {
    throw new GradleException('Assinatura release ausente. Use scripts/build-release.ps1 com a chave privada do Ritmo.')
}

`;
  let result = setup + contents;
  const shiftedSigningConfigs = result.indexOf('    signingConfigs {');
  const releaseConfig = `
        ritmoRelease {
            if (ritmoStorePath && file(ritmoStorePath).isFile() && ritmoStorePassword && ritmoKeyAlias && ritmoKeyPassword) {
                storeFile file(ritmoStorePath)
                storePassword ritmoStorePassword
                keyAlias ritmoKeyAlias
                keyPassword ritmoKeyPassword
            }
        }
`;
  const insertAt = shiftedSigningConfigs + '    signingConfigs {'.length;
  result = result.slice(0, insertAt) + releaseConfig + result.slice(insertAt);
  const releaseStart = result.indexOf('        release {', result.indexOf('    buildTypes {'));
  const signature = result.indexOf('signingConfig signingConfigs.debug', releaseStart);
  return (
    result.slice(0, signature) +
    'signingConfig signingConfigs.ritmoRelease' +
    result.slice(signature + 'signingConfig signingConfigs.debug'.length)
  );
}

module.exports = function withRitmoAndroidSecurity(config) {
  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (!application) throw new Error('Aplicação Android não encontrada no manifesto.');
    application.$['android:allowBackup'] = 'false';
    application.$['android:fullBackupContent'] = '@xml/ritmo_backup_rules';
    application.$['android:dataExtractionRules'] = '@xml/ritmo_data_extraction_rules';
    return mod;
  });
  config = withDangerousMod(config, [
    'android',
    async (mod) => {
      const directory = path.join(
        mod.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml',
      );
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(path.join(directory, 'ritmo_backup_rules.xml'), backupRules);
      fs.writeFileSync(path.join(directory, 'ritmo_data_extraction_rules.xml'), extractionRules);
      return mod;
    },
  ]);
  return withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = patchReleaseSigning(mod.modResults.contents);
    return mod;
  });
};

module.exports.patchReleaseSigning = patchReleaseSigning;
