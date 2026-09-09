import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as queueApi from '../../api/queue.api.js';

vi.mock('../../api/queue.api.js', () => ({
  listQueue: vi.fn(),
}));

async function importUseQueue() {
  const mod = await import('../useQueue.js');
  return mod.useQueue;
}

describe('useQueue', () => {
  const mockListQueue = vi.mocked(queueApi.listQueue);

  beforeEach(() => {
    mockListQueue.mockResolvedValue({ data: [], meta: { total: 0 } });
  });

  it('calls listQueue with default params on init', async () => {
    const useQueue = await importUseQueue();
    useQueue();
    await new Promise((r) => setTimeout(r, 0));
    expect(mockListQueue).toHaveBeenCalledWith({
      status: 'QUEUED,IN_PROGRESS',
      sort: '-createdAt',
    });
  });

  it('calls listQueue with updated status when setStatusFilter is called', async () => {
    vi.resetModules();
    const useQueue = await importUseQueue();
    const { setStatusFilter } = useQueue();
    mockListQueue.mockClear();
    setStatusFilter(['DONE']);
    await new Promise((r) => setTimeout(r, 10));
    expect(mockListQueue).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'DONE' }),
    );
  });

  it('calls listQueue with updated sort when setSort is called', async () => {
    vi.resetModules();
    const useQueue = await importUseQueue();
    const { setSort } = useQueue();
    mockListQueue.mockClear();
    setSort('duration');
    await new Promise((r) => setTimeout(r, 10));
    expect(mockListQueue).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'duration' }),
    );
  });
});
