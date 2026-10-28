import { expect, test, type Locator, type Page } from '@playwright/test';
import { emptyDatabase, newRoutine, startWorkout } from '../../src/model';

// A reduced browser viewport exercises scrolling/layout, not a real Android IME.
async function visibleAboveBottom(page: Page, field: Locator) {
  await expect(field).toBeFocused();
  await expect
    .poll(async () => {
      const box = await field.boundingBox();
      return (
        !!box && box.y >= 0 && box.y + Math.min(box.height, 300) <= page.viewportSize()!.height - 12
      );
    })
    .toBe(true);
}

test('editor reposiciona o campo ao reduzir a área útil e permite ler o restante sem perder a edição', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar minha primeira rotina', exact: true }).click();
  const field = page.getByLabel('Descanso exercício 1 série 3', { exact: true });
  await field.fill('120');
  await page.setViewportSize({ width: 390, height: 430 });
  await visibleAboveBottom(page, field);
  await field.fill('135');
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Salvar rotina', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(field).toHaveValue('135');
});

test('campos de carga continuam visíveis depois da redução e a rolagem manual não volta sozinha', async ({
  page,
}) => {
  const r = newRoutine();
  r.name = 'Teste teclado';
  Object.assign(r.exercises[0], { name: 'Supino', reps: Array(10).fill('12') });
  const active = startWorkout(r);
  await page.addInitScript((db) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(db)), {
    ...emptyDatabase(),
    routines: [r],
    active,
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  const field = page.getByLabel('Supino série 8 carga em kg', { exact: true });
  await field.fill('25');
  await page.setViewportSize({ width: 320, height: 430 });
  await visibleAboveBottom(page, field);
  await page.screenshot({ path: 'test-results/teclado-web-carga-320.png' });
  await page.getByLabel('Supino série 1 repetições', { exact: true }).scrollIntoViewIfNeeded();
  // Observe one animation-settling interval: manual reading must not trigger refocusing.
  await page.waitForTimeout(500);
  await expect(page.getByLabel('Supino série 1 repetições', { exact: true })).toBeInViewport();
  await expect(field).toHaveValue('25');
});

test('modal com fórmula longa mantém o campo e rótulo acessíveis e salva o rascunho após rolar', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Suplementos', exact: true }).click();
  await page.getByRole('button', { name: 'Acompanhar substâncias', exact: true }).click();
  await page.getByRole('button', { name: 'Nova substância', exact: true }).click();
  await page.getByLabel('Nome da substância', { exact: true }).fill('Modelo teclado');
  const field = page.getByLabel('Referência e hipóteses', { exact: true });
  await field.fill('Modelo matemático de teste.\n' + 'Hipótese de teste.\n'.repeat(14));
  await page.setViewportSize({ width: 320, height: 430 });
  await visibleAboveBottom(page, field);
  await page.screenshot({ path: 'test-results/teclado-web-modal-320.png' });
  await page.getByRole('button', { name: 'Salvar substância', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Registrar ingestão de Modelo teclado', exact: true }),
  ).toBeVisible();
});

test('JSON grande usa rolagem interna e mantém o rascunho ao abrir e recolher a área do teclado', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Editar fórmulas em lote', exact: true }).click();
  const field = page.getByLabel('JSON de fórmulas em lote', { exact: true });
  const json = JSON.stringify(
    {
      formato: 'ritmo-formulas/1',
      exercicios: Array(30).fill({ rotinaId: 'rascunho', exercicioId: 'rascunho', calorias: null }),
    },
    null,
    2,
  );
  await field.fill(json);
  await page.setViewportSize({ width: 390, height: 430 });
  await visibleAboveBottom(page, field);
  await expect
    .poll(() => field.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  await page
    .getByRole('button', { name: 'Conferir alterações de fórmulas', exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole('button', { name: 'Conferir alterações de fórmulas', exact: true }),
  ).toBeInViewport();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(field).toHaveValue(json);
});
