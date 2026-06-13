/**
 * A stand-in for the Supabase client used only in DEMO_MODE. It implements just
 * enough of the surface the app touches (from/rpc/auth/channel/functions/storage)
 * to render every screen with sample data. Filters (.eq/.order/…) are accepted
 * but mostly no-ops — design mode wants populated screens, not query fidelity.
 */
import { TABLES, demoUser, demoSession } from './data';
import { resolveRpc } from './rpc';

type Result = { data: unknown; error: null };

class DemoQuery implements PromiseLike<Result> {
  private rows: Record<string, unknown>[];
  private singleMode = false;

  constructor(table: string) {
    this.rows = TABLES[table] ? [...TABLES[table]] : [];
  }

  // Selectors / modifiers — accepted, return self for chaining.
  select() { return this; }
  order() { return this; }
  limit() { return this; }
  range() { return this; }
  eq() { return this; }
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

  // Mutations — echo the payload back as if written.
  insert(payload: unknown) {
    const arr = Array.isArray(payload) ? payload : [payload];
    this.rows = arr.map((r, i) => ({ id: `demo-${Date.now()}-${i}`, ...(r as object) }));
    return this;
  }
  update(payload: unknown) {
    this.rows = this.rows.map((r) => ({ ...r, ...(payload as object) }));
    return this;
  }
  upsert(payload: unknown) { return this.insert(payload); }
  delete() { this.rows = []; return this; }

  then<T = Result>(onfulfilled?: ((value: Result) => T | PromiseLike<T>) | null): PromiseLike<T> {
    const data = this.singleMode ? (this.rows[0] ?? null) : this.rows;
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
      invoke: async () => ({ data: { success: true }, error: null }),
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
