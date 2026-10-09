import type { SkillDTO, SkillInput, SkillUpdateInput } from '@portfolio/shared';
import { AppError } from '../../errors/AppError';
import { transaction } from '../../lib/db';
import type { Skill } from '../../generated/prisma/client';
import { auditService } from '../audit/audit.service';
import type { Actor } from '../audit/audit.types';
import { diffSnapshots, hasChanges, type Snapshot } from '../audit/diff';
import { skillRepository } from './skills.repository';

const toSkillDTO = ({ id, name, category, level, order }: Skill): SkillDTO => ({
  id,
  name,
  category,
  level,
  order,
});

const toSnapshot = ({ name, category, level, order }: Skill): Snapshot => ({
  name,
  category,
  level,
  order,
});

async function findOrThrow(id: string) {
  const skill = await skillRepository.findById(id);
  if (!skill) throw AppError.notFound('Habilidade não encontrada', 'SKILL_NOT_FOUND');
  return skill;
}

// Nome duplicado (P2002) vira 409 no errorHandler.
export const skillService = {
  async list() {
    return (await skillRepository.findAll()).map(toSkillDTO);
  },

  async create(input: SkillInput, actor: Actor) {
    const skill = await transaction(async (tx) => {
      const created = await skillRepository.create(input, tx);
      await auditService.record(
        actor,
        {
          action: 'CREATE',
          entity: 'Skill',
          entityId: created.id,
          entityLabel: created.name,
          changes: { after: toSnapshot(created) },
        },
        tx,
      );
      return created;
    });
    return toSkillDTO(skill);
  },

  async update(id: string, input: SkillUpdateInput, actor: Actor) {
    const current = await findOrThrow(id);

    const skill = await transaction(async (tx) => {
      const updated = await skillRepository.update(id, input, tx);
      const changes = diffSnapshots(toSnapshot(current), toSnapshot(updated));
      if (hasChanges(changes)) {
        await auditService.record(
          actor,
          { action: 'UPDATE', entity: 'Skill', entityId: id, entityLabel: updated.name, changes },
          tx,
        );
      }
      return updated;
    });
    return toSkillDTO(skill);
  },

  async remove(id: string, actor: Actor) {
    const current = await findOrThrow(id);

    await transaction(async (tx) => {
      await skillRepository.delete(id, tx);
      await auditService.record(
        actor,
        {
          action: 'DELETE',
          entity: 'Skill',
          entityId: id,
          entityLabel: current.name,
          changes: { before: toSnapshot(current) },
        },
        tx,
      );
    });
  },
};
