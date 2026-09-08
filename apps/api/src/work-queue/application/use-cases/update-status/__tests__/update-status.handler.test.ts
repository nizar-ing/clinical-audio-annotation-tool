import { describe, it, expect } from 'vitest';
import { UpdateStatusHandler } from '../update-status.handler.js';
import { DomainException } from '../../../../../shared/domain/exceptions/domain.exception.js';
import { NotFoundException } from '../../../../../shared/domain/exceptions/application.exception.js';
import type { RecordingStatusPort } from '../../../ports/recording-status.port.js';
import type { RecordingStatus } from '../../../../../ingestion/domain/value-objects/recording-status.vo.js';

class FakeRecordingStatusPort implements RecordingStatusPort {
  public updates: Array<{ id: string; status: RecordingStatus }> = [];
  constructor(private readonly seed: Map<string, RecordingStatus>) {}
  async findStatusById(id: string) {
    const status = this.seed.get(id);
    return status ? { status } : null;
  }
  async updateStatus(id: string, status: RecordingStatus) {
    this.updates.push({ id, status });
    this.seed.set(id, status);
  }
}

describe('UpdateStatusHandler', () => {
  it('promotes QUEUED → IN_PROGRESS', async () => {
    const port = new FakeRecordingStatusPort(new Map([['r1', 'QUEUED']]));
    const handler = new UpdateStatusHandler(port);

    const result = await handler.execute({ recordingId: 'r1', next: 'IN_PROGRESS' });

    expect(result).toEqual({ id: 'r1', status: 'IN_PROGRESS' });
    expect(port.updates).toEqual([{ id: 'r1', status: 'IN_PROGRESS' }]);
  });

  it('completes IN_PROGRESS → DONE', async () => {
    const port = new FakeRecordingStatusPort(new Map([['r1', 'IN_PROGRESS']]));
    const handler = new UpdateStatusHandler(port);

    await handler.execute({ recordingId: 'r1', next: 'DONE' });

    expect(port.updates).toEqual([{ id: 'r1', status: 'DONE' }]);
  });

  it('rejects an illegal transition with DomainException and does not persist', async () => {
    const port = new FakeRecordingStatusPort(new Map([['r1', 'QUEUED']]));
    const handler = new UpdateStatusHandler(port);

    await expect(handler.execute({ recordingId: 'r1', next: 'DONE' })).rejects.toBeInstanceOf(DomainException);
    expect(port.updates).toEqual([]);
  });

  it('refuses to move out of the terminal REJECTED_TOO_SHORT status', async () => {
    const port = new FakeRecordingStatusPort(new Map([['r1', 'REJECTED_TOO_SHORT']]));
    const handler = new UpdateStatusHandler(port);

    await expect(handler.execute({ recordingId: 'r1', next: 'QUEUED' })).rejects.toBeInstanceOf(DomainException);
    expect(port.updates).toEqual([]);
  });

  it('throws NotFoundException when the recording does not exist', async () => {
    const port = new FakeRecordingStatusPort(new Map());
    const handler = new UpdateStatusHandler(port);

    await expect(handler.execute({ recordingId: 'missing', next: 'IN_PROGRESS' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(port.updates).toEqual([]);
  });
});
