import { MAX_PROJECT_IMAGES, type ProjectDTO } from '@portfolio/shared';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { TrashIcon, UploadIcon } from '@/components/Icons';
import { assetUrl } from '@/lib/api';
import { useDeleteImage, useUploadImages } from '../api';
import styles from '../admin.module.scss';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_SIZE_MB = 5;

/** Validação no cliente só para feedback rápido; a API revalida tudo (inclusive o conteúdo). */
function validateFiles(files: File[], remainingSlots: number): string | null {
  if (files.length > remainingSlots)
    return `Você pode adicionar mais ${remainingSlots} imagem(ns).`;
  const invalidType = files.find((file) => !ACCEPTED_TYPES.includes(file.type));
  if (invalidType) return `"${invalidType.name}" não é JPEG, PNG, WebP ou AVIF.`;
  const tooBig = files.find((file) => file.size > MAX_SIZE_MB * 1024 * 1024);
  if (tooBig) return `"${tooBig.name}" passa de ${MAX_SIZE_MB}MB.`;
  return null;
}

export function ImageUploader({ project }: { project: ProjectDTO }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upload = useUploadImages();
  const remove = useDeleteImage();

  const remainingSlots = MAX_PROJECT_IMAGES - project.images.length;

  const send = (files: File[]) => {
    if (files.length === 0) return;
    const validationError = validateFiles(files, remainingSlots);
    setError(validationError);
    if (validationError) return;

    upload.mutate({ id: project.id, files }, { onError: (err) => setError(err.message) });
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    send(Array.from(event.dataTransfer.files));
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    send(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  return (
    <div className={styles.uploader}>
      {project.images.length > 0 && (
        <ul className={styles.thumbs}>
          {project.images.map((image, index) => (
            <li key={image.id}>
              <img
                src={assetUrl(image.url)}
                alt={image.alt}
                width={image.width ?? undefined}
                height={image.height ?? undefined}
                loading="lazy"
              />
              {index === 0 && <span className={styles.coverBadge}>Capa</span>}
              <button
                type="button"
                aria-label="Remover imagem"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ id: project.id, imageId: image.id })}
              >
                <TrashIcon width={16} height={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {remainingSlots > 0 && (
        <button
          type="button"
          className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          disabled={upload.isPending}
        >
          <UploadIcon width={22} height={22} />
          <span>
            {upload.isPending ? 'Enviando…' : 'Arraste imagens ou clique para selecionar'}
          </span>
          <small>
            JPEG, PNG, WebP ou AVIF · até {MAX_SIZE_MB}MB · {remainingSlots} restante(s)
            <br />
            Convertidas para WebP; metadados (EXIF, localização GPS) são removidos.
          </small>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        hidden
        onChange={handleChange}
      />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
