import { expect, test } from '@playwright/test';

test('atalhos em duas linhas de três, separados da criação de divisão', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  const grid = page.getByTestId('routine-actions-grid');
  const buttons = grid.getByRole('button');
  await expect(buttons).toHaveCount(6);
  await expect(grid.getByRole('button', { name: 'Pausar treinos de força' })).toBeDisabled();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const boxes = await buttons.evaluateAll((elements) =>
      elements.map((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      }),
    );
    for (let index = 0; index < boxes.length; index++) {
      const box = boxes[index];
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y).toBeCloseTo(boxes[index < 3 ? 0 : 3].y, 1);
    }
    expect(boxes[3].y).toBeGreaterThan(boxes[0].y + boxes[0].height);
    const division = page.getByRole('button', { name: 'Nova divisão', exact: true });
    await expect(grid.getByRole('button', { name: 'Nova divisão', exact: true })).toHaveCount(0);
    const divisionBox = await division.boundingBox();
    expect(divisionBox!.y).toBeGreaterThan(boxes[3].y + boxes[3].height);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: 'test-results/rotinas-grade-20261013.png',
    animations: 'disabled',
  });
  for (const name of [
    'Cobertura muscular',
    'Rotinas de cardio',
    'Importar treinos por texto',
    'Backup e restauração',
    'Conjuntos de rotinas',
  ]) {
    await grid.getByRole('button', { name, exact: true }).click();
    await expect(grid).toHaveCount(0);
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    await expect(grid).toBeVisible();
  }
});
