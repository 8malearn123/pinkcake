import { describe, it, expect } from 'vitest';
import { createDemoClient } from '../client';
import { resolveRpc } from '../rpc';
import { getDemoRole, setDemoRole } from '../config';

const db = createDemoClient();

describe('demo query builder', () => {
  it('returns sample rows for a known table, ignoring filters', async () => {
    const { data, error } = await db.from('products').select('*').eq('is_available', true).order('display_order');
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect((data as unknown[]).length).toBeGreaterThan(0);
  });

  it('single() resolves to the first row', async () => {
    const { data } = await db.from('branches').select('*').eq('id', 'b1').single();
    expect(data).toBeTruthy();
    expect((data as { name: string }).name).toBeTruthy();
  });

  it('unknown table resolves to an empty array, not an error', async () => {
    const { data, error } = await db.from('does_not_exist').select('*');
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('insert echoes the payload back with an id', async () => {
    const { data } = await db.from('orders').insert({ order_number: 'X' }).select().single();
    expect((data as { order_number: string; id: string }).order_number).toBe('X');
    expect((data as { id: string }).id).toMatch(/^demo-/);
  });
});

describe('demo rpc', () => {
  it('get_my_roles follows the selected demo role', async () => {
    setDemoRole('kitchen');
    expect(getDemoRole()).toBe('kitchen');
    const { data } = await db.rpc('get_my_roles');
    expect(data).toEqual(['kitchen']);
    setDemoRole('admin');
    expect((await db.rpc('get_my_roles')).data).toEqual(['admin']);
  });

  it('read RPCs return sample collections', async () => {
    expect(((await db.rpc('get_orders_for_admin')).data as unknown[]).length).toBeGreaterThan(0);
    expect(((await db.rpc('get_products_for_public_store')).data as unknown[]).length).toBeGreaterThan(0);
  });

  it('unknown / write RPCs return a generic success', () => {
    expect(resolveRpc('kitchen_mark_order_ready', { _order_id: 'o1' })).toMatchObject({ success: true });
  });
});

describe('demo auth', () => {
  it('reports a signed-in demo session', async () => {
    const { data } = await db.auth.getSession();
    expect(data.session?.user?.email).toContain('@');
  });
});
