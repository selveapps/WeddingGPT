/**
 * An in-memory stand-in for the sync server (server/auth/sync.mjs), following
 * the same rules: server-ordered seq, version per record, the later push wins
 * and returns what it overwrote, tombstones without contents, idempotent
 * mutation ids. Lets engine tests run two "phones" against one server.
 */
export function createFakeSyncServer() {
  const records = new Map();
  const seen = new Map();
  let seq = 0;
  const calls = { push: 0, pull: 0 };
  let failWith = null;

  const fail = () => {
    if (failWith) {
      const error = failWith;
      failWith = null;
      throw error;
    }
  };

  const client = {
    async push(token, workspaceId, mutations) {
      calls.push += 1;
      fail();
      const applied = [];
      const conflicts = [];
      for (const m of mutations) {
        const key = `${workspaceId}:${m.collection}:${m.id}`;
        if (seen.has(m.mutationId)) {
          applied.push(seen.get(m.mutationId));
          continue;
        }
        const existing = records.get(key);
        const version = (existing?.version ?? 0) + 1;
        seq += 1;
        records.set(key, {
          workspaceId,
          collection: m.collection,
          id: m.id,
          version,
          seq,
          deletedAt: m.op === 'delete' ? new Date().toISOString() : null,
          data: m.op === 'delete' ? null : m.data,
          updatedBy: token,
        });
        const result = { mutationId: m.mutationId, version, seq };
        seen.set(m.mutationId, result);
        applied.push(result);
        if (existing && existing.version !== (m.baseVersion ?? 0)) {
          conflicts.push({
            mutationId: m.mutationId,
            overwritten: {
              version: existing.version,
              updatedBy: existing.updatedBy,
              deletedAt: existing.deletedAt,
              data: existing.data,
            },
          });
        }
      }
      return { applied, conflicts, rejected: [] };
    },

    async pull(token, workspaceId, { since = 0, limit = 500 } = {}) {
      calls.pull += 1;
      fail();
      const all = [...records.values()]
        .filter((r) => r.workspaceId === workspaceId && r.seq > since)
        .sort((x, y) => x.seq - y.seq);
      const page = all.slice(0, limit);
      return {
        records: page.map(({ collection, id, version, deletedAt, data }) => ({
          collection,
          id,
          version,
          deletedAt,
          data,
        })),
        cursor: page.length ? page[page.length - 1].seq : since,
        hasMore: all.length > limit,
      };
    },
  };

  return {
    client,
    calls,
    record: (workspaceId, collection, id) => records.get(`${workspaceId}:${collection}:${id}`),
    failNext(error) {
      failWith = error;
    },
  };
}
