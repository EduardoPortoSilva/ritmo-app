import { expect, test } from '@playwright/test';
import { emptyDatabase } from '../../src/model';
import { newCardioRoutine, startCardio } from '../../src/cardio';

test('distância estimada acumula por etapa e preserva pausa, retomada e limite do cardio', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-14T12:00:00') });
  const routine = newCardioRoutine();
  routine.name = 'Distância por etapa';
  routine.steps = [
    { id: 'walking', minutes: '1', speed: '6' },
    { id: 'running', minutes: '1', speed: '12' },
  ];
  await page.addInitScript(
    (database) => {
      if (!localStorage.getItem('@ritmo/database/v1'))
        localStorage.setItem('@ritmo/database/v1', JSON.stringify(database));
    },
    { ...emptyDatabase(), cardioRoutines: [routine], activeCardio: startCardio(routine) },
  );
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Continuar cardio: Distância por etapa', exact: true })
    .click();
  const distance = page.getByTestId('cardio-distance');
  await expect(distance).toHaveText('Distância estimada: 0,00 km');
  await page.getByRole('button', { name: 'Iniciar cardio agora', exact: true }).click();
  await page.clock.fastForward(1000);
  await expect(distance).toHaveText('Distância estimada: 0,00 km');
  await page.clock.fastForward(3000);
  await expect(distance).toHaveText('Distância estimada: 0,01 km');
  await page.clock.fastForward(56_000);
  await expect(page.getByTestId('cardio-speed')).toHaveText('12');
  await expect(distance).toHaveText('Distância estimada: 0,10 km');
  await page.clock.fastForward(15_000);
  await expect(distance).toHaveText('Distância estimada: 0,15 km');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await distance.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/cardio-distance-20261014-${width}.png` });
  }
  await page.getByRole('button', { name: 'Pausar cardio', exact: true }).click();
  await page.clock.fastForward(45_000);
  await expect(distance).toHaveText('Distância estimada: 0,15 km');
  await page.reload();
  await page
    .getByRole('button', { name: 'Continuar cardio: Distância por etapa', exact: true })
    .click();
  await expect(distance).toHaveText('Distância estimada: 0,15 km');
  await page.getByRole('button', { name: 'Retomar cardio', exact: true }).click();
  await page.clock.fastForward(45_000);
  await expect(page.getByText('CARDIO CONCLUÍDO', { exact: true })).toBeVisible();
  await expect(distance).toHaveText('Distância estimada: 0,30 km');
  await page.clock.fastForward(60_000);
  await expect(distance).toHaveText('Distância estimada: 0,30 km');
});

test('cardio semanal troca velocidades, pausa e retoma após reabrir o app', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-28T12:00:00') });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await page.getByRole('button', { name: 'Rotinas de cardio' }).click();
  await page.getByRole('button', { name: 'Novo cardio' }).click();
  await page.getByLabel('Nome do cardio').fill('HIIT curto');
  await page.getByRole('checkbox', { name: 'Cardio · Segunda-feira' }).click();
  await page.getByLabel('Duração da etapa 1 (min)').fill('0,1');
  await page.getByLabel('Velocidade da etapa 1 (km/h)').fill('5');
  await page.getByRole('button', { name: 'Adicionar etapa' }).click();
  await page.getByLabel('Velocidade da etapa 2 (km/h)').fill('7');
  await page.getByRole('button', { name: 'Salvar cardio' }).click();
  await expect(page.getByText('HIIT curto', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByRole('tab', { name: 'Início' }).click();
  await expect(page.getByTestId('today-cardio')).toContainText('HIIT curto');
  await page
    .getByTestId('today-cardio')
    .getByRole('button', { name: 'Iniciar cardio HIIT curto' })
    .click();
  await expect(page.getByTestId('cardio-speed')).toHaveText('5');
  await page.getByRole('button', { name: 'Iniciar cardio agora' }).click();
  await page.clock.fastForward(6100);
  await expect(page.getByTestId('cardio-speed')).toHaveText('7');
  await page.screenshot({ path: 'test-results/cardio-modo.png' });
  await page.getByRole('button', { name: 'Pausar cardio' }).click();
  const paused = await page.evaluate(
    () => JSON.parse(localStorage.getItem('@ritmo/database/v1')!).activeCardio.elapsedMs,
  );
  await page.clock.fastForward(10_000);
  await expect(page.getByTestId('cardio-speed')).toHaveText('7');
  await page.reload();
  await page
    .getByTestId('today-cardio')
    .getByRole('button', { name: 'Continuar cardio: HIIT curto' })
    .click();
  await expect(page.getByTestId('cardio-speed')).toHaveText('7');
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('@ritmo/database/v1')!).activeCardio.elapsedMs,
    ),
  ).toBe(paused);
  await page.getByRole('button', { name: 'Retomar cardio' }).click();
  await page.clock.fastForward(6000);
  await expect(page.getByText('CARDIO CONCLUÍDO')).toBeVisible();
  await page.getByRole('button', { name: 'Encerrar cardio' }).click();
  await expect(page.getByText('Distância esperada:', { exact: false })).toBeVisible();
  await page.getByLabel('Distância percorrida (km)').fill('0,02');
  await expect(page.getByTestId('cardio-distance-feedback')).toHaveText(
    'Distância dentro do esperado',
  );
  await page.getByLabel('Distância percorrida (km)').fill('0,029');
  await expect(page.getByTestId('cardio-distance-feedback')).toHaveText(
    'Distância dentro do esperado',
  );
  await page.getByLabel('Distância percorrida (km)').fill('0,03');
  await expect(page.getByTestId('cardio-distance-feedback')).toContainText('acima do esperado');
  await page.getByLabel('Distância percorrida (km)').fill('0,22');
  await expect(page.getByTestId('cardio-distance-feedback')).toContainText('acima do esperado');
  await page.getByRole('button', { name: 'Salvar cardio no histórico' }).click();
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem('@ritmo/database/v1')!).activeCardio),
    )
    .toBeNull();
  await expect(page.getByRole('button', { name: 'Ver cardio HIIT curto' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver cardio HIIT curto' }).click();
  await expect(page.getByText('Distância percorrida: 0,22 km')).toBeVisible();
  await page.reload();
  await page.getByRole('tab', { name: 'Histórico' }).click();
  await expect(page.getByRole('button', { name: 'Ver cardio HIIT curto' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver cardio HIIT curto' }).click();
  await expect(page.getByText(/acima do esperado/)).toBeVisible();
  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await page.getByRole('button', { name: 'Rotinas de cardio' }).click();
  await page.getByRole('button', { name: 'Iniciar cardio HIIT curto' }).click();
  await page.getByRole('button', { name: 'Iniciar cardio agora' }).click();
  await page.clock.fastForward(12_100);
  await page.getByRole('button', { name: 'Encerrar cardio' }).click();
  await page.getByLabel('Distância percorrida (km)').fill('0,02');
  await page.getByRole('button', { name: 'Salvar cardio no histórico' }).click();
  await page.getByRole('button', { name: 'Ver cardio HIIT curto' }).first().click();
  await expect(page.getByText('Distância dentro do esperado')).toBeVisible();
});
