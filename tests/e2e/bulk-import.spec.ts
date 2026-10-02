import { expect, test } from '@playwright/test';
import { bulkImportExample } from '../../src/bulkImport';

test('recusa clipboard acima do limite sem trocar o texto em edição', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await page.getByRole('button', { name: 'Importar treinos por texto' }).click();
  const input = page.getByLabel('JSON de importação');
  await input.fill('{"formato":"ritmo/1"}');
  await page.evaluate(() => navigator.clipboard.writeText('x'.repeat(100_001)));
  await page.getByRole('button', { name: 'Colar texto copiado' }).click();
  await expect(page.getByRole('alert')).toContainText('Nada foi colado');
  await expect(input).toHaveValue('{"formato":"ritmo/1"}');
});

test('valida texto, mostra prévia e importa divisão e cardio de uma vez', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await page.getByRole('button', { name: 'Importar treinos por texto' }).click();
  await page.getByRole('button', { name: 'Entender a gramática' }).click();
  const guide = page.getByTestId('bulk-import-guide');
  await expect(guide).toContainText('repeticoes');
  await expect(guide).toContainText('velocidade');
  await expect(guide).toContainText('principal');
  await page.screenshot({ path: 'test-results/importacao-gramatica.png' });
  await page.getByRole('button', { name: 'Ocultar explicação' }).click();
  await expect(guide).toHaveCount(0);
  await page
    .getByLabel('JSON de importação')
    .fill('{"formato":"ritmo/1","treinos":[{"nome":"Incompleto"}]}');
  await page.getByRole('button', { name: 'Conferir texto' }).click();
  await expect(page.getByRole('alert')).toContainText('treinos[0].exercicios');
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('@ritmo/database/v1') ?? '{"routines":[]}').routines.length,
    ),
  ).toBe(0);

  await page.getByLabel('JSON de importação').fill(bulkImportExample);
  await page.getByRole('button', { name: 'Conferir texto' }).click();
  const preview = page.getByTestId('bulk-import-preview');
  await expect(preview).toContainText('Divisão ABC');
  await expect(preview).toContainText('Cardio: HIIT curto');
  await preview.getByRole('button', { name: 'Ver detalhes do treino A - Peito' }).click();
  await expect(preview).toContainText('Supino reto · 12 / 10 / 8 reps');
  await preview.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/importacao-previa.png' });
  await page.getByRole('button', { name: 'Importar rotinas da prévia' }).click();
  await expect(page.getByText('Importar 2 rotinas?')).toBeVisible();
  await page.getByRole('button', { name: 'Voltar' }).last().click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('@ritmo/database/v1') ?? '{"routines":[]}').routines.length,
    ),
  ).toBe(0);
  await page.getByRole('button', { name: 'Importar rotinas da prévia' }).click();
  await page.getByRole('button', { name: 'Importar rotinas', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ver divisão ABC' })).toBeVisible();
  await page.getByRole('button', { name: 'Rotinas de cardio' }).click();
  await expect(page.getByRole('button', { name: 'Iniciar cardio HIIT curto' })).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await expect(page.getByRole('button', { name: 'Ver divisão ABC' })).toBeVisible();
  await page.getByRole('button', { name: 'Importar treinos por texto' }).click();
  await page.getByLabel('JSON de importação').fill(bulkImportExample);
  await page.getByRole('button', { name: 'Conferir texto' }).click();
  await expect(page.getByRole('alert')).toContainText('já existe');
});
