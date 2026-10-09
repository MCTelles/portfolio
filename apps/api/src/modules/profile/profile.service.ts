import { socialLinkSchema, type ProfileDTO, type ProfileInput } from '@portfolio/shared';
import { AppError } from '../../errors/AppError';
import { transaction } from '../../lib/db';
import type { Profile } from '../../generated/prisma/client';
import { auditService } from '../audit/audit.service';
import type { Actor } from '../audit/audit.types';
import { diffSnapshots, hasChanges, type Snapshot } from '../audit/diff';
import { PROFILE_ID, profileRepository } from './profile.repository';

// `socials` é uma coluna Json: valida na leitura para o contrato nunca vazar lixo.
const socialsSchema = socialLinkSchema.array().catch([]);

const toProfileDTO = (profile: Profile): ProfileDTO => ({
  name: profile.name,
  headline: profile.headline,
  bio: profile.bio,
  location: profile.location,
  avatarUrl: profile.avatarUrl,
  socials: socialsSchema.parse(profile.socials),
});

const toSnapshot = (profile: ProfileDTO): Snapshot => ({ ...profile });

export const profileService = {
  async get() {
    const profile = await profileRepository.find();
    if (!profile) throw AppError.notFound('Perfil ainda não configurado', 'PROFILE_NOT_FOUND');
    return toProfileDTO(profile);
  },

  async save(input: ProfileInput, actor: Actor) {
    const current = await profileRepository.find();

    const profile = await transaction(async (tx) => {
      const saved = toProfileDTO(
        await profileRepository.upsert(
          { ...input, location: input.location || null, avatarUrl: input.avatarUrl || null },
          tx,
        ),
      );

      const entityId = String(PROFILE_ID);
      if (!current) {
        await auditService.record(
          actor,
          {
            action: 'CREATE',
            entity: 'Profile',
            entityId,
            entityLabel: saved.name,
            changes: { after: toSnapshot(saved) },
          },
          tx,
        );
      } else {
        const changes = diffSnapshots(toSnapshot(toProfileDTO(current)), toSnapshot(saved));
        if (hasChanges(changes)) {
          await auditService.record(
            actor,
            { action: 'UPDATE', entity: 'Profile', entityId, entityLabel: saved.name, changes },
            tx,
          );
        }
      }
      return saved;
    });

    return profile;
  },
};
