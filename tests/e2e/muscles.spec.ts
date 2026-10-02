import { test, expect } from '@playwright/test';
import { emptyDatabase, newRoutine, startWorkout } from '../../src/model';

test('vincular grupos e músculos, persistir, descartar e consultar o desenho e a cobertura', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar minha primeira rotina', exact: true }).click();
  await page.getByLabel('Nome da rotina', { exact: true }).fill('Cobertura A');
  await page.getByLabel('Nome do exercício 1', { exact: true }).fill('Exercício misto');
  await page.getByRole('button', { name: 'Vincular músculos · exercício 1', exact: true }).click();
  const picker = page.getByTestId('muscle-picker-1');
  await picker.getByLabel('Buscar grupo ou músculo', { exact: true }).fill('peitoral');
  await picker.getByRole('radio', { name: 'Peitoral · Principal', exact: true }).click();
  await picker
    .getByRole('radio', { name: 'Peitoral maior · porção clavicular · Secundário', exact: true })
    .click();
  await picker.getByLabel('Buscar grupo ou músculo', { exact: true }).fill('vasto lateral');
  await picker.getByRole('radio', { name: 'Vasto lateral · Principal', exact: true }).click();
  const searchBox = await picker
    .getByLabel('Buscar grupo ou músculo', { exact: true })
    .boundingBox();
  const countBox = await picker.getByTestId('muscle-search-count').boundingBox();
  expect(countBox!.y).toBeGreaterThanOrEqual(searchBox!.y + searchBox!.height);
  await picker
    .getByRole('radio', { name: 'Vasto lateral · Principal', exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/musculos-vinculos.png' });
  await page.getByRole('button', { name: 'Ver mapa muscular do exercício 1' }).click();
  let modal = page.getByTestId('exercise-muscle-modal');
  await expect(modal.getByText('Exercício misto', { exact: true })).toBeVisible();
  await expect(modal.getByTestId('body-front-chest')).toHaveAttribute('fill', /url.*primary/);
  await expect(modal.getByTestId('body-front-vastus-lateralis')).toHaveAttribute('fill', '#387A53');
  await modal.getByRole('button', { name: 'Explorar Peitoral maior', exact: true }).click();
  await expect(modal.getByTestId('exercise-muscle-detail')).toContainText(
    'Peitoral maior não foi especificado',
  );
  await modal.getByRole('button', { name: 'Fechar mapa muscular' }).click();
  await expect(modal).toHaveCount(0);
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  await page.getByRole('button', { name: 'Ver mapa muscular de Exercício misto' }).click();
  modal = page.getByTestId('exercise-muscle-modal');
  await expect(modal.getByTestId('body-front-vastus-lateralis')).toHaveAttribute('fill', '#387A53');
  await expect(modal).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/musculos-modal-exercicio.png' });
  await modal.getByRole('button', { name: 'Fechar mapa muscular' }).click();
  await page.getByRole('button', { name: 'Cobertura muscular', exact: true }).click();
  const detail = page.getByTestId('coverage-detail');
  await expect(
    detail.getByText('3 séries principais · 0 séries secundárias', { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('body-front-chest')).toHaveAttribute('fill', /url.*primary/);
  await expect(page.getByTestId('body-front-vastus-lateralis')).toHaveAttribute('fill', '#387A53');
  await page.getByTestId('coverage-map').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/musculos-mapa-detalhado.png' });
  await page.getByTestId('body-front-vastus-lateralis').click();
  await expect(detail.getByText('Vasto lateral', { exact: true })).toBeVisible();
  await expect(
    detail.getByText('3 séries principais · 0 séries secundárias', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Buscar na cobertura', { exact: true }).fill('vasto medial');
  await page.getByRole('button', { name: 'Analisar músculo Vasto medial', exact: true }).click();
  await expect(
    detail.getByText('0 séries principais · 0 séries secundárias', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Cobertura A', exact: true }).click();
  await page.getByRole('button', { name: 'Vincular músculos · exercício 1', exact: true }).click();
  await page.getByRole('button', { name: 'Remover vínculo Peitoral', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar alterações', exact: true }).click();
  await page.reload();
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Ver rotina Cobertura A', exact: true }).click();
  await expect(page.getByText(/Peitoral \(principal\)/)).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
  await page.getByRole('button', { name: 'Ver mapa muscular de Exercício misto' }).click();
  modal = page.getByTestId('exercise-muscle-modal');
  await expect(modal.getByTestId('body-front-vastus-lateralis')).toHaveAttribute('fill', '#387A53');
  await modal.getByRole('button', { name: 'Fechar mapa muscular' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('@ritmo/database/v1')!).active.exercises[0].muscles
            .length,
      ),
    )
    .toBe(3);
  await page.getByLabel('Exercício misto série 1 carga em kg').fill('0');
  await page.getByRole('checkbox', { name: 'Concluir Exercício misto série 1' }).click();
  await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar treino', exact: true }).click();
  await page.getByRole('button', { name: /^Ver treino Cobertura A/ }).click();
  await page.getByRole('button', { name: 'Ver mapa muscular de Exercício misto' }).click();
  modal = page.getByTestId('exercise-muscle-modal');
  await expect(modal.getByText('Vasto lateral · Principal')).toBeVisible();
  await modal.getByRole('button', { name: 'Fechar mapa muscular' }).click();
});

test('modal de exercício antigo mostra ausência de vínculos sem alterar a rotina', async ({
  page,
}) => {
  const routine = newRoutine();
  routine.name = 'Rotina antiga';
  routine.exercises[0].name = 'Legado sem vínculo';
  const db = { ...emptyDatabase(), routines: [routine] };
  await page.addInitScript(
    (data) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(data)),
    db,
  );
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Ver rotina Rotina antiga', exact: true }).click();
  await page.getByRole('button', { name: 'Ver mapa muscular de Legado sem vínculo' }).click();
  const modal = page.getByTestId('exercise-muscle-modal');
  await expect(modal.getByText(/Nenhum músculo foi vinculado/)).toBeVisible();
  await expect(modal.getByTestId('body-front-chest')).toHaveCount(0);
  await modal.getByRole('button', { name: 'Fechar mapa muscular' }).click();
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('@ritmo/database/v1')!)))
    .toEqual(db);
});

test('divisão combina treinos sem multiplicar dias e mantém pendências explícitas', async ({
  page,
}) => {
  const a = newRoutine();
  a.name = 'A';
  a.division = { id: 'abc', name: 'ABC' };
  a.weekdays = [1, 3];
  a.exercises[0].name = 'Supino';
  a.exercises[0].muscles = [{ nodeId: 'chest', role: 'primary' }];
  const b = newRoutine();
  b.name = 'B';
  b.division = { id: 'abc', name: 'ABC' };
  b.exercises[0].name = 'Legado sem vínculo';
  const active = startWorkout(a);
  const db = { ...emptyDatabase(), routines: [a, b], active };
  await page.addInitScript(
    (data) => localStorage.setItem('@ritmo/database/v1', JSON.stringify(data)),
    db,
  );
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Ver divisão ABC', exact: true }).click();
  await page.getByRole('button', { name: 'Cobertura muscular da divisão', exact: true }).click();
  const detail = page.getByTestId('coverage-detail');
  await expect(
    detail.getByText('3 séries principais · 0 séries secundárias', { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('coverage-unlinked')).toContainText('1 exercícios sem vínculo');
  await page.getByRole('button', { name: 'Analisar músculo Peitoral maior', exact: true }).click();
  await expect(detail.getByText(/Há vínculo com um grupo acima/)).toBeVisible();
  await expect(
    detail.getByText('0 séries principais · 0 séries secundárias', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Trocar rotina ou divisão', exact: true }).click();
  await page.getByRole('radio', { name: 'Analisar Rotina · B', exact: true }).click();
  await expect(page.getByText('0 de 20 regiões com algum vínculo', { exact: true })).toBeVisible();
  await expect(page.getByTestId('body-front-chest')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('@ritmo/database/v1')!).active))
    .toEqual(active);
});
