import { DomainException } from '../../../shared/domain/exceptions/domain.exception.js';

export class UnsupportedFormatException extends DomainException {
  constructor(mimeType: string) {
    super(`Unsupported audio format: ${mimeType}. Accepted: audio/wav, audio/mpeg, audio/mp4.`);
    this.name = 'UnsupportedFormatException';
  }
}
