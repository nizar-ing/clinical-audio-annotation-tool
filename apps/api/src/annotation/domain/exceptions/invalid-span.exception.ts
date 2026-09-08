import { DomainException } from '../../../shared/domain/exceptions/domain.exception.js';

export class InvalidSpanException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
