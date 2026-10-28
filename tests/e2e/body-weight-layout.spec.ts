import { expect, test } from '@playwright/test';
import { emptyDatabase, newRoutine, startWorkout } from '../../src/model';

for (const count of [1, 4, 30]) {
  test(`peso corporal cabe na tela com ${count} registros, sem perder pontos`, async ({ page }) => {
    const routine = newRoutine();
    routine.name = 'Peso corporal';
    routine.exercises[0].name = 'Supino';
    const workouts = Array.from({ length: count }, (_, index) => {
      const workout = startWorkout(routine);
      workout.finishedAt = new Date(Date.UTC(2026, 8, index + 1, 15)).toISOString();
      workout.bodyWeight = ['77,7', '77,4', '77,4', '77,5'][index % 4];
      Object.assign(workout.exercises[0].sets[0], { weight: '20', done: true });
      return workout;
    });
    const database = { ...emptyDatabase(), routines: [routine], workouts: workouts.reverse() };
    await page.addInitScript(
      (db) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(db)),
      database,
    );
    await page.goto('/');
    const chart = page.getByTestId('body-weight-chart');
    const plot = page.getByTestId('body-weight-plot');
    const records = chart.getByTestId(/^body-weight-record-/);
    await expect(records).toHaveCount(count);
    await expect(chart.getByTestId(/^body-weight-point-/)).toHaveCount(count);
    await expect(chart.getByTestId(/^body-weight-line-/)).toHaveCount(count - 1);
    await expect(chart).not.toContainText('Deslize');

    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await chart.scrollIntoViewIfNeeded();
      await expect(async () => {
        const bounds = (await plot.boundingBox())!;
        const boxes = await records.evaluateAll((elements) =>
          elements.map((element) => {
            const box = element.getBoundingClientRect();
            return { left: box.left, right: box.right };
          }),
        );
        for (const box of boxes) {
          expect(box.left).toBeGreaterThanOrEqual(bounds.x - 1);
          expect(box.right).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
        }
        const overflow = await plot.evaluate(
          (element) => element.scrollWidth - element.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(1);
        const dates = await chart.getByText(/^\d{2}\/\d{2}$/).evaluateAll((elements) =>
          elements.map((element) => {
            const box = element.getBoundingClientRect();
            return { left: box.left, right: box.right };
          }),
        );
        expect(dates.length).toBeGreaterThanOrEqual(Math.min(2, count));
        for (let index = 1; index < dates.length; index++)
          expect(dates[index].left).toBeGreaterThanOrEqual(dates[index - 1].right);
      }).toPass({ timeout: 5000 });
      await chart.screenshot({ path: `test-results/peso-sem-rolagem-${count}-${width}.png` });
    }

    await page.getByRole('tab', { name: 'Gráficos', exact: true }).click();
    await page.getByRole('radio', { name: 'Período Tudo', exact: true }).click();
    await expect(records).toHaveCount(count);
    await expect(plot).toBeVisible();
  });
}
