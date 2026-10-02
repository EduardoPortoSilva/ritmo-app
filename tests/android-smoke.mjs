// Optional native smoke test. Requires an emulator with the Ritmo APK installed.
// Adds a routine and one completed workout to the test emulator only.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const serial = process.env.ANDROID_TEST_SERIAL || 'emulator-5554';
if (!serial.startsWith('emulator-')) throw new Error('Execute somente em um emulador de testes.');
const adb = (...args) =>
  execFileSync('adb', ['-s', serial, ...args], { timeout: 30000, maxBuffer: 16000000 });
const shell = (...args) => adb('shell', ...args).toString('utf8');
function nodes() {
  const result = shell('uiautomator', 'dump', '/sdcard/ritmo-smoke.xml');
  if (!result.includes('dumped')) return [];
  const xml = shell('cat', '/sdcard/ritmo-smoke.xml');
  return [...xml.matchAll(/<node\b([^>]+)>/g)].map((match) =>
    Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]])),
  );
}
function tap(label) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const visible = nodes().filter((n) => {
      const [x1, y1, x2, y2] = n.bounds.match(/\d+/g).map(Number);
      return x2 > x1 && y2 > y1;
    });
    const node =
      visible.find((n) => n['content-desc'] === label) ?? visible.find((n) => n.text === label);
    if (node) {
      const [x1, y1, x2, y2] = node.bounds.match(/\d+/g).map(Number);
      shell('input', 'tap', String(Math.round((x1 + x2) / 2)), String(Math.round((y1 + y2) / 2)));
      return;
    }
    shell('input', 'swipe', '540', '1800', '540', '700', '300');
  }
  throw new Error(`Elemento não encontrado: ${label}`);
}
function input(label, value) {
  tap(label);
  shell('input', 'text', value);
  shell('input', 'keyevent', '4');
}
function expectText(text) {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (nodes().some((n) => n.text.includes(text) || n['content-desc'].includes(text))) return;
  }
  assert.fail(`Texto não encontrado: ${text}`);
}
function screenshot(name) {
  mkdirSync('test-results', { recursive: true });
  writeFileSync(`test-results/android-${name}.png`, adb('exec-out', 'screencap', '-p'));
}

shell('am', 'force-stop', 'com.ritmo.treinos');
shell('am', 'start', '-W', '-n', 'com.ritmo.treinos/.MainActivity');
expectText('Um treino de cada vez.');
screenshot('inicio');
tap('Rotinas');
tap('Nova rotina');
input('Nome da rotina', 'TesteAndroid');
input('Nome do exercício 1', 'Supino');
tap('Salvar rotina');
tap('Iniciar treino');
input('Supino série 1 carga em kg', '20');
tap('Concluir Supino série 1');
expectText('1/3 séries');
screenshot('treino');
shell('am', 'force-stop', 'com.ritmo.treinos');
shell('am', 'start', '-n', 'com.ritmo.treinos/.MainActivity');
tap('Continuar treino');
expectText('1/3 séries');
tap('Finalizar treino');
tap('Salvar treino');
expectText('Seu histórico');
const history = nodes().find((n) => n['content-desc'].startsWith('Ver treino TesteAndroid'));
assert.ok(history, 'O treino deve aparecer no histórico nativo');
tap(history['content-desc']);
expectText('12 reps × 20 kg');
screenshot('historico');
console.log(
  'Android: cadastro, registro, retomada após encerrar o processo e histórico aprovados.',
);
