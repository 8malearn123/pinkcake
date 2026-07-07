/**
 * A stand-in for the Supabase client used only in DEMO_MODE. It implements just
 * enough of the surface the app touches (from/rpc/auth/channel/functions/storage)
 * to render every screen with sample data.
 *
 * Most tables use a lightweight "echo" behaviour: filters (.eq/.order/…) are
 * accepted but no-op, and mutations echo their payload back — design mode wants
 * populated screens, not query fidelity. The user-management tables (LIVE_TABLES)
 * are the exception: they persist against the shared demo arrays with real .eq()
 * filtering, so the admin Users/Branches flows (add user, assign role, assign
 * branch, impersonate) actually take effect and reflect on refetch instead of
 * feeling like dead buttons.
 */
import {
  TABLES,
  demoUser,
  demoSession,
  mutateOrderStatus,
  LIVE_TABLES,
  insertDemoRows,
  deleteDemoRows,
  updateDemoRows,
  selectDemoRows,
} from './data';
import { resolveRpc, resolveFunction } from './rpc';

type Result = { data: unknown; error: null };
type Filter = [string, unknown];

class DemoQuery implements PromiseLike<Result> {
  private table: string;
  private isLive: boolean;
  private rows: Record<string, unknown>[];
  private singleMode = false;
  private eqFilters: Filter[] = [];
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private updatePayload: Record<string, unknown> | null = null;
  private insertedRows: Record<string, unknown>[] = [];

  constructor(table: string) {
    this.table = table;
    this.isLive = LIVE_TABLES.has(table);
    // Echo tables work off a copy; live tables resolve against the shared array.
    this.rows = !this.isLive && TABLES[table] ? [...TABLES[table]] : [];
  }

  // Selectors / modifiers — accepted, return self for chaining.
  select() { return this; }
  order() { return this; }
  limit() { return this; }
  range() { return this; }
  eq(col: string, val: unknown) { this.eqFilters.push([col, val]); return this; }
  neq() { return this; }
  gt() { return this; }
  gte() { return this; }
  lt() { return this; }
  lte() { return this; }
  like() { return this; }
  ilike() { return this; }
  is() { return this; }
  in() { return this; }
  contains() { return this; }
  or() { return this; }
  not() { return this; }
  match() { return this; }
  filter() { return this; }
  maybeSingle() { this.singleMode = true; return this; }
  single() { this.singleMode = true; return this; }

  // Mutations.
  insert(payload: unknown) {
    this.op = 'insert';
    if (this.isLive) {
      this.insertedRows = insertDemoRows(this.table, payload);
    } else {
      const arr = Array.isArray(payload) ? payload : [payload];
      this.rows = arr.map((r, i) => ({ id: `demo-${Date.now()}-${i}`, ...(r as object) }));
    }
    return this;
  }
  // Deferred so the .eq() filter (which chains AFTER .update()) is known at resolve time.
  update(payload: unknown) {
    this.op = 'update';
    this.updatePayload = payload as Record<string, unknown>;
    return this;
  }
  upsert(payload: unknown) { return this.insert(payload); }
  delete() {
    this.op = 'delete';
    if (!this.isLive) this.rows = [];
    return this;
  }

  // Resolve a live (stateful) table op against the shared demo arrays.
  private resolveLive(): unknown {
    switch (this.op) {
      case 'insert':
        return this.singleMode ? (this.insertedRows[0] ?? null) : this.insertedRows;
      case 'delete':
        deleteDemoRows(this.table, this.eqFilters);
        return this.singleMode ? null : [];
      case 'update': {
        const updated = updateDemoRows(this.table, this.eqFilters, this.updatePayload ?? {});
        return this.singleMode ? (updated[0] ?? null) : updated;
      }
      default: {
        const rows = selectDemoRows(this.table, this.eqFilters);
        return this.singleMode ? (rows[0] ?? null) : rows;
      }
    }
  }

  then<T = Result>(onfulfilled?: ((value: Result) => T | PromiseLike<T>) | null): PromiseLike<T> {
    let data: unknown;
    if (this.isLive) {
      data = this.resolveLive();
    } else {
      if (this.updatePayload) {
        const idFilter = this.eqFilters.find(([c]) => c === 'id');
        // Order updates persist to the live demo data so kitchen/branch/driver
        // cards actually move; everything else keeps the echo behaviour.
        if (this.table === 'orders' && idFilter) {
          const row = mutateOrderStatus(idFilter[1], this.updatePayload);
          this.rows = row ? [row] : [{ ...this.updatePayload }];
        } else {
          this.rows = this.rows.map((r) => ({ ...r, ...this.updatePayload }));
        }
      }
      data = this.singleMode ? (this.rows[0] ?? null) : this.rows;
    }
    return Promise.resolve({ data, error: null } as Result).then(onfulfilled);
  }
}

const noopChannel = () => {
  const ch = {
    on: () => ch,
    subscribe: (cb?: (status: string) => void) => { cb?.('SUBSCRIBED'); return ch; },
    unsubscribe: () => Promise.resolve('ok'),
  };
  return ch;
};

export function createDemoClient() {
  return {
    from: (table: string) => new DemoQuery(table),
    rpc: (name: string, args?: Record<string, unknown>) =>
      Promise.resolve({ data: resolveRpc(name, args), error: null }),

    auth: {
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        // Fire async so subscribers attach first (mirrors the real client).
        setTimeout(() => cb('SIGNED_IN', demoSession), 0);
        return { data: { subscription: { unsubscribe() {} } } };
      },
      getSession: async () => ({ data: { session: demoSession }, error: null }),
      getUser: async () => ({ data: { user: demoUser }, error: null }),
      signInWithPassword: async () => ({ data: { user: demoUser, session: demoSession }, error: null }),
      signUp: async () => ({ data: { user: demoUser, session: demoSession }, error: null }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ data: {}, error: null }),
      updateUser: async () => ({ data: { user: demoUser }, error: null }),
    },

    channel: noopChannel,
    removeChannel: () => Promise.resolve('ok'),
    getChannels: () => [],

    functions: {
      // Dispatch by function name; user-management functions mutate demo state.
      invoke: async (name: string, options?: { body?: Record<string, unknown> }) =>
        resolveFunction(name, options?.body),
    },

    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'demo/image.png' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '/placeholder.svg' } }),
        remove: async () => ({ data: [], error: null }),
      }),
    },
  };
}
