export interface StoredFile {
  /** Identificador interno usado para remover o arquivo. */
  key: string;
  /** URL pública servida ao frontend. */
  url: string;
}

/**
 * Abstração de armazenamento de arquivos. Hoje grava em disco; trocar por S3/R2
 * significa só criar outra implementação, sem tocar em services ou controllers.
 */
export interface StorageService {
  save(file: { buffer: Buffer; extension: string }): Promise<StoredFile>;
  remove(key: string): Promise<void>;
}
