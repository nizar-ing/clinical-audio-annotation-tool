// Layered here (not imported from shared/infrastructure) so the application layer never depends
// on infrastructure. The adapter maps the shared kernel's RiffMetadata onto this shape.
export interface ListInfoTags {
  [tag: string]: string;
}

export interface BroadcastExtension {
  description?: string;
  originator?: string;
  originatorReference?: string;
  originationDate?: string;
  originationTime?: string;
}

export interface AudioHeaderMetadata {
  listInfo?: ListInfoTags;
  bext?: BroadcastExtension;
}

export interface AudioHeaderReaderPort {
  read(storageKey: string, mimeType: string): Promise<AudioHeaderMetadata | null>;
}
