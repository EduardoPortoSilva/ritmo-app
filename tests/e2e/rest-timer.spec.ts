import { expect, test } from '@playwright/test';

test('descanso por série inicia, pausa, retoma e termina no treino', async ({ page }) => {
  await page.addInitScript(() => {
    const trackedWindow = window as Window & { restCuePlays?: number };
    trackedWindow.restCuePlays = 0;
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (this.src.includes('cardio-cue')) trackedWindow.restCuePlays! += 1;
      return originalPlay.call(this).catch(() => undefined);
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar minha primeira rotina' }).click();
  await page.getByLabel('Nome da rotina', { exact: true }).fill('Treino com descanso');
  await page.getByLabel('Nome do exercício 1', { exact: true }).fill('Supino');
  await page.getByLabel('Descanso exercício 1 série 1', { exact: true }).fill('2');
  await page
    .getByRole('button', { name: 'Aplicar descanso da série 1 a todas · exercício 1' })
    .click();
  await expect(page.getByLabel('Descanso exercício 1 série 3', { exact: true })).toHaveValue('2');
  await page.getByLabel('Descanso exercício 1 série 2', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Iniciar descanso de Supino série 2' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Iniciar descanso de Supino série 1' }).click();
  await expect(
    page.getByRole('button', { name: 'Pausar descanso de Supino série 1' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Pausar descanso de Supino série 1' }).click();
  const paused = await page
    .getByTestId(/^rest-remaining-/)
    .first()
    .textContent();
  await page.waitForTimeout(1100);
  await expect(page.getByTestId(/^rest-remaining-/).first()).toHaveText(paused!);
  await page.getByRole('button', { name: 'Retomar descanso de Supino série 1' }).click();
  await expect(page.getByText('Descanso concluído')).toBeVisible({ timeout: 5000 });
  await expect
    .poll(() =>
      page.evaluate(() => (window as Window & { restCuePlays?: number }).restCuePlays ?? 0),
    )
    .toBe(1);
  await page.waitForTimeout(2500);
  await expect(
    page.getByRole('button', { name: 'Reiniciar descanso de Supino série 1' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar descanso de Supino série 3' }).click();
  await expect(
    page.getByRole('button', { name: 'Pausar descanso de Supino série 3' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Pausar descanso de Supino série 3' }).click();
});
