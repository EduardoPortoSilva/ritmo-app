import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyboardScrollOffset } from '../src/keyboardGeometry.ts';

test('campo que ficou sob o teclado sobe com folga, mesmo se a janela não redimensionar', () => {
  const state = {
    offset: 100,
    viewportTop: 70,
    viewportHeight: 700,
    inputTop: 620,
    inputHeight: 48,
    keyboardTop: 480,
  };
  assert.equal(keyboardScrollOffset(state), 308);
  assert.equal(keyboardScrollOffset({ ...state, viewportHeight: 410 }), 308);
});
test('campo visível preserva posição; campo acima da área visível permite ver também o rótulo', () => {
  const state = {
    offset: 200,
    viewportTop: 70,
    viewportHeight: 400,
    inputTop: 200,
    inputHeight: 48,
  };
  assert.equal(keyboardScrollOffset(state), 200);
  assert.equal(keyboardScrollOffset({ ...state, inputTop: 60 }), 158);
  assert.equal(keyboardScrollOffset({ ...state, offset: 0, inputTop: 60 }), 0);
});
test('texto maior que a área livre alinha pelo topo, mantendo sua rolagem interna utilizável', () => {
  assert.equal(
    keyboardScrollOffset({
      offset: 100,
      viewportTop: 50,
      viewportHeight: 300,
      inputTop: 200,
      inputHeight: 600,
    }),
    218,
  );
});
test('sem área útil não tenta rolar; ao recolher teclado, um campo já visível não provoca salto', () => {
  assert.equal(
    keyboardScrollOffset({
      offset: 100,
      viewportTop: 50,
      viewportHeight: 40,
      inputTop: 200,
      inputHeight: 48,
    }),
    100,
  );
  assert.equal(
    keyboardScrollOffset({
      offset: 100,
      viewportTop: 50,
      viewportHeight: 700,
      inputTop: 400,
      inputHeight: 48,
    }),
    100,
  );
});
