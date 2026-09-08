import { NotFoundException } from '../../../../shared/domain/exceptions/application.exception.js';

import type { AnnotationRepositoryPort } from '../../ports/annotation.repository.port.js';

export class DeleteSpanHandler {
  constructor(private readonly annotations: AnnotationRepositoryPort) {}

  async execute(id: string): Promise<void> {
    const span = await this.annotations.findById(id);
    if (!span) throw new NotFoundException(`Annotation span ${id} not found`);
    await this.annotations.delete(id);
  }
}
