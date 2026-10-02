import { expect, test } from '@playwright/test';

test('guarda o plano anterior e alterna conjuntos com rotina compartilhada', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await page.getByRole('button', { name: 'Importar treinos por texto' }).click();
  await page.getByLabel('JSON de importação').fill(
    JSON.stringify({
      formato: 'ritmo/1',
      treinos: [
        { nome: 'Treino A', dias: ['seg'], exercicios: [{ nome: 'Supino', repeticoes: [12] }] },
        { nome: 'Treino B', dias: ['ter'], exercicios: [{ nome: 'Remada', repeticoes: [10] }] },
      ],
    }),
  );
  await page.getByRole('button', { name: 'Conferir texto' }).click();
  await page.getByRole('button', { name: 'Importar rotinas da prévia' }).click();
  await page.getByRole('button', { name: 'Importar rotinas', exact: true }).click();

  await page.getByRole('button', { name: 'Conjuntos de rotinas' }).click();
  await page.getByRole('button', { name: 'Novo conjunto' }).click();
  await page.getByLabel('Nome do conjunto').fill('Novo ciclo');
  await page.getByRole('checkbox', { name: 'Adicionar Treino A' }).click();
  await page.getByRole('button', { name: 'Salvar conjunto' }).click();
  await expect(page.getByText('Planejamento atual', { exact: true })).toBeVisible();
  await expect(page.getByText('Novo ciclo', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ativar Novo ciclo' }).click();
  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(page.getByText('Conjunto ativo: Novo ciclo')).toBeVisible();
  await expect(page.getByText('Treino A', { exact: true })).toBeVisible();
  await expect(page.getByText('Treino B', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Pausar treinos de força' }).click();
  await expect(page.getByTestId('strength-paused')).toContainText('cardios e histórico');
  await expect(page.getByText('Treino A', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: 'test-results/planejamento-forca-pausado.png' });
  await page.reload();
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await expect(page.getByTestId('strength-paused')).toBeVisible();
  await page.getByRole('button', { name: 'Retomar treinos de força' }).click();
  await expect(page.getByText('Treino A', { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole('tab', { name: 'Rotinas' }).click();
  await expect(page.getByText('Conjunto ativo: Novo ciclo')).toBeVisible();
  await page.getByRole('button', { name: 'Conjuntos de rotinas' }).click();
  await page.getByRole('button', { name: 'Ativar Planejamento atual' }).click();
  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(page.getByText('Treino B', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Conjuntos de rotinas' }).click();
  await page.getByRole('button', { name: 'Novo conjunto' }).click();
  await page.getByLabel('Nome do conjunto').fill('Descanso');
  await page.getByRole('button', { name: 'Salvar conjunto' }).click();
  await page.getByRole('button', { name: 'Ativar Descanso' }).click();
  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(page.getByText('Nenhuma rotina neste conjunto')).toBeVisible();
  await page.getByRole('tab', { name: 'Início' }).click();
  await expect(page.getByRole('button', { name: 'Criar rotina neste conjunto' })).toBeVisible();
});
