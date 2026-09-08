import type { QueueReadPort, QueueItem } from '../../ports/queue.read.port.js';
import type { ListQueueQuery } from '../../queries/list-queue.query.js';

export class ListQueueHandler {
  constructor(private readonly queue: QueueReadPort) {}

  async execute(query: ListQueueQuery): Promise<{ items: QueueItem[]; total: number }> {
    return this.queue.list(query);
  }
}
