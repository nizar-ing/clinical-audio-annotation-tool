export interface AudioStoragePort {
  put(filename: string, data: Buffer): Promise<string>;
  getPath(storageKey: string): string;
  delete(storageKey: string): Promise<void>;
}
