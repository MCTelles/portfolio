import bcrypt from 'bcryptjs';

const HASH_ROUNDS = 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, HASH_ROUNDS);

export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

// Hash usado quando o e-mail não existe: a comparação roda do mesmo jeito,
// então o tempo de resposta não revela quais e-mails estão cadastrados.
export const TIMING_GUARD_HASH = bcrypt.hashSync('timing-attack-guard', HASH_ROUNDS);
