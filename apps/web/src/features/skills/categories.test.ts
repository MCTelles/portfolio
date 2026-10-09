import { describe, expect, it } from 'vitest';
import { levelTier, timingCodes } from './categories';

describe('timingCodes', () => {
  it('usa as 3 primeiras letras, como na torre da TV', () => {
    expect(timingCodes(['TypeScript', 'Node.js', 'Docker'])).toEqual(['TYP', 'NOD', 'DOC']);
  });

  it('desempata colisões pelas iniciais', () => {
    expect(timingCodes(['React', 'React Native'])).toEqual(['REA', 'RNA']);
  });

  it('nunca repete siglas, mesmo com nomes iguais no começo', () => {
    const codes = timingCodes(['Prisma', 'Prettier', 'Pr', 'Prisma Studio', 'Postgres']);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.every((code) => code.length === 3)).toBe(true);
  });
});

describe('levelTier', () => {
  it('converte nível em cor de cronometragem', () => {
    expect([5, 4, 3, 2, null].map(levelTier)).toEqual([
      'purple',
      'green',
      'yellow',
      'white',
      'white',
    ]);
  });
});
