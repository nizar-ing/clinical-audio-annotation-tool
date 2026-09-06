export interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  size: number;
}

export interface UploadRecordingsCommand {
  files: UploadedFile[];
}
