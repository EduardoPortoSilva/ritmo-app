import { expect, test } from '@playwright/test';
import { bulkImportExample } from '../../src/bulkImport';

test('exporta um arquivo completo e restaura apenas apos previa e confirmacao', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await page.getByRole('button', { name: 'Importar treinos por texto' }).click();
  await page.getByLabel('JSON de importação').fill(bulkImportExample);
  await page.getByRole('button', { name: 'Conferir texto' }).click();
  await page.getByRole('button', { name: 'Importar rotinas da prévia' }).click();
  await page.getByRole('button', { name: 'Importar rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Backup e restauração' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup para arquivo' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^ritmo-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backupText = await (
    await import('node:fs/promises')
  ).readFile(await download.path(), 'utf8');
  const backup = JSON.parse(backupText);
  expect(backup.format).toBe('ritmo-backup/1');
  expect(backup.database.routines).toHaveLength(1);
  expect(backup.database.cardioRoutines).toHaveLength(1);

  await page.goto('about:blank');
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('@ritmo/database/v1');
    } catch {
      /* other origins */
    }
  });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await page.getByRole('button', { name: 'Backup e restauração' }).click();
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Escolher arquivo de backup' }).click();
  await (
    await chooserPromise
  ).setFiles({
    name: 'ritmo-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(backupText),
  });
  await expect(page.getByTestId('backup-preview')).toContainText('1 rotina de força');
  expect(await page.evaluate(() => localStorage.getItem('@ritmo/database/v1'))).toBeNull();
  await page.getByRole('button', { name: 'Restaurar este backup' }).click();
  await expect(page.getByText('Substituir todos os dados?')).toBeVisible();
  await page.getByRole('button', { name: 'Voltar' }).last().click();
  expect(await page.evaluate(() => localStorage.getItem('@ritmo/database/v1'))).toBeNull();
  await page.getByRole('button', { name: 'Restaurar este backup' }).click();
  await page.getByRole('button', { name: 'Restaurar dados' }).click();
  await expect(page.getByText('Backup restaurado. Confira seus dados.')).toBeVisible();
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await expect(page.getByRole('button', { name: 'Ver divisão ABC' })).toBeVisible();
});

test('recusa arquivo acima do limite antes da previa', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await page.getByRole('button', { name: 'Backup e restaura\u00e7\u00e3o' }).click();
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Escolher arquivo de backup' }).click();
  await (
    await chooserPromise
  ).setFiles({
    name: 'enorme.json',
    mimeType: 'application/json',
    buffer: Buffer.alloc(8_000_001, 32),
  });
  await expect(
    page.getByText('O arquivo \u00e9 grande demais para restaurar com seguran\u00e7a.'),
  ).toBeVisible();
  await expect(page.getByTestId('backup-preview')).toHaveCount(0);
});
