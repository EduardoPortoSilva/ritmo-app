import { expect, test } from '@playwright/test';
import { emptyDatabase } from '../../src/model';

test('cadastrar suplementos, confirmar hoje, desfazer, editar e excluir com persistência', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(2026, 8, 17, 12));
  await page.goto('/');
  await page.getByRole('tab', { name: 'Suplementos', exact: true }).click();
  await page.getByRole('button', { name: 'Novo suplemento', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar suplemento' }).click();
  await expect(page.getByText('Informe o nome do suplemento.')).toBeVisible();
  await page.getByRole('button', { name: 'Entendi' }).click();
  await page.getByLabel('Nome do suplemento', { exact: true }).fill('Creatina');
  await page.getByLabel('Observação (opcional)', { exact: true }).fill('Depois do café');
  await expect(page.getByRole('checkbox', { name: 'Ativar lembrete diário' })).toBeDisabled();
  await page.getByRole('button', { name: 'Salvar suplemento' }).click();
  await page.getByRole('button', { name: 'Novo suplemento', exact: true }).click();
  await page.getByLabel('Nome do suplemento', { exact: true }).fill('Whey');
  await page.getByRole('button', { name: 'Salvar suplemento' }).click();
  await page.getByRole('checkbox', { name: 'Tomei Creatina hoje', exact: true }).click();
  await expect(page.getByLabel('Sequência de Creatina: 1 dias', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('checkbox', { name: 'Tomei Whey hoje', exact: true }),
  ).not.toBeChecked();
  await page.reload();
  await page.getByRole('button', { name: 'Ver suplementos', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Tomei Creatina hoje', exact: true }),
  ).toBeChecked();
  await page.getByRole('checkbox', { name: 'Tomei Creatina hoje', exact: true }).click();
  await expect(page.getByLabel('Sequência de Creatina: 0 dias', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Tomei Creatina hoje', exact: true }).click();
  await page.getByRole('button', { name: 'Editar suplemento Creatina', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByText('Sair da edição?')).toHaveCount(0);
  await page.getByRole('button', { name: 'Editar suplemento Creatina', exact: true }).click();
  await page.getByLabel('Nome do suplemento', { exact: true }).fill('Rascunho');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar alterações', exact: true }).click();
  await page.getByRole('button', { name: 'Editar suplemento Creatina', exact: true }).click();
  await page.getByLabel('Nome do suplemento', { exact: true }).fill('Creatina diária');
  await page.getByRole('button', { name: 'Salvar suplemento' }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Tomei Creatina diária hoje', exact: true }),
  ).toBeChecked();
  await page.screenshot({ path: 'test-results/suplementos.png', fullPage: true });
  await page.getByRole('button', { name: 'Excluir suplemento Whey', exact: true }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Tomei Whey hoje', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Excluir suplemento Whey', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir suplemento', exact: true }).click();
  await page.reload();
  await page.getByRole('tab', { name: 'Suplementos', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Tomei Whey hoje', exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('checkbox', { name: 'Tomei Creatina diária hoje', exact: true }),
  ).toBeChecked();
});

test('sequência atravessa dias, mantém ontem e reinicia após faltar um dia completo', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(2026, 8, 17, 12));
  await page.addInitScript(
    (db) => {
      if (!localStorage.getItem('@ritmo/database/v1'))
        localStorage.setItem('@ritmo/database/v1', JSON.stringify(db));
    },
    {
      ...emptyDatabase(),
      supplements: [
        {
          id: 'creatina',
          name: 'Creatina',
          note: '',
          createdAt: '2026-09-14T12:00:00Z',
          takenOn: ['2026-09-15', '2026-09-16'],
        },
      ],
    },
  );
  await page.goto('/');
  await page.getByRole('tab', { name: 'Suplementos', exact: true }).click();
  await expect(page.getByLabel('Sequência de Creatina: 2 dias', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Tomei Creatina hoje', exact: true }).click();
  await expect(page.getByLabel('Sequência de Creatina: 3 dias', { exact: true })).toBeVisible();
  await page.clock.setFixedTime(new Date(2026, 8, 18, 12));
  await page.reload();
  await page.getByRole('tab', { name: 'Suplementos', exact: true }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Tomei Creatina hoje', exact: true }),
  ).not.toBeChecked();
  await expect(page.getByLabel('Sequência de Creatina: 3 dias', { exact: true })).toBeVisible();
  await page.clock.setFixedTime(new Date(2026, 8, 19, 12));
  await page.reload();
  await page.getByRole('tab', { name: 'Suplementos', exact: true }).click();
  await expect(page.getByLabel('Sequência de Creatina: 0 dias', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Tomei Creatina hoje', exact: true }).click();
  await expect(page.getByLabel('Sequência de Creatina: 1 dias', { exact: true })).toBeVisible();
});
