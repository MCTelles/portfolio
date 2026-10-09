import { useState, type KeyboardEvent } from 'react';
import { XIcon } from '@/components/Icons';
import styles from '../admin.module.scss';

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  placeholder?: string;
}

/** Enter ou vírgula adicionam; Backspace com o campo vazio remove a última tag. */
export function TagInput({ value, onChange, onBlur, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const tag = draft.trim().replace(/,$/, '');
    if (tag && !value.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      onChange([...value, tag]);
    }
    setDraft('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className={styles.tagInput}>
      {value.map((tag) => (
        <span key={tag} className={styles.tagChip}>
          {tag}
          <button
            type="button"
            aria-label={`Remover ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
          >
            <XIcon width={12} height={12} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          commit();
          onBlur?.();
        }}
        placeholder={value.length === 0 ? placeholder : undefined}
      />
    </div>
  );
}
