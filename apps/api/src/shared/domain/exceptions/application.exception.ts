export class NotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundException';
  }
}

export class ConflictException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictException';
  }
}
