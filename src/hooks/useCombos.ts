import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { toast } from '@/hooks/use-toast';
import * as doc from '@/lib/combosCatalog/doc';
import * as session from '@/lib/combosCatalog/session';
import type { MutationOutcome } from '@/lib/combosCatalog/session';
import { validateImageFile } from '@/lib/imageFiles';
import type { ComboDraft, ComboItem } from '@/lib/combosCatalog/types';

/**
 * The combos catalog, for both sides of the app.
 *
 * The storefront reads `combos` + `urlFor` and ignores the rest; the dashboard
 * («المنتجات» → «الكومبوهات») uses the mutations. Both subscribe to the same
 * module singleton, so a dashboard edit shows up on an open storefront tab
 * immediately — and, via the session's `storage` listener, across tabs too.
 *
 * Unlike the cake catalog this needs no Context: that one only wrapped its
 * session to dodge react-query's `gcTime` evicting live object URLs, and a
 * `useSyncExternalStore` subscription has no such problem.
 */

const STORAGE_HELP = 'قد تكون مساحة المتصفح ممتلئة — احذف بعض الصور ثم أعد المحاولة.';

function report(outcome: MutationOutcome): boolean {
  if (outcome.ok) return true;
  toast({
    title: outcome.reason === 'storage' ? 'تعذّر الحفظ' : 'تعذّر حفظ التغيير',
    description:
      outcome.reason === 'storage'
        ? STORAGE_HELP
        : outcome.error instanceof Error
          ? outcome.error.message
          : 'حدث خطأ غير متوقع',
    variant: 'destructive',
  });
  return false;
}

export interface UseCombosResult {
  status: session.SessionState['status'];
  error: string | null;
  /** Ordered by `displayOrder` — the order the storefront and the table share. */
  combos: ComboItem[];
  /** Only the combos the storefront is allowed to render. */
  activeCombos: ComboItem[];
  urlFor: (imageId: string | null | undefined) => string | undefined;
  /** Resolved hero: the uploaded blob when there is one, else the URL. */
  heroSrcFor: (combo: ComboItem) => string;
  createCombo: (draft: ComboDraft, heroFile?: File | null) => Promise<boolean>;
  saveCombo: (id: string, draft: ComboDraft, heroFile?: File | null) => Promise<boolean>;
  removeCombo: (id: string) => Promise<boolean>;
  clearHero: (id: string) => Promise<boolean>;
  makeBest: (id: string | null) => Promise<boolean>;
  setActive: (id: string, isActive: boolean) => Promise<boolean>;
  reorder: (orderedIds: string[]) => Promise<boolean>;
  reload: () => void;
  resetAll: () => Promise<boolean>;
}

export function useCombos(): UseCombosResult {
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot);

  useEffect(() => {
    void session.ensureLoaded();
  }, []);

  const { doc: current, urls, status, error } = snapshot;

  const combos = useMemo(() => doc.orderedCombos(current), [current]);
  const activeCombos = useMemo(() => combos.filter((combo) => combo.isActive), [combos]);

  const urlFor = useCallback(
    (imageId: string | null | undefined) => (imageId ? urls[imageId] : undefined),
    [urls],
  );

  const heroSrcFor = useCallback((combo: ComboItem) => doc.comboHeroSrc(combo, urlFor), [urlFor]);

  /** Reject the file before it reaches the queue, so a bad pick can't block a write. */
  const rejectFile = useCallback((file: File | null | undefined) => {
    if (!file) return false;
    const rejection = validateImageFile(file);
    if (!rejection) return false;
    toast({ title: rejection.title, description: rejection.description, variant: 'destructive' });
    return true;
  }, []);

  const createCombo = useCallback(
    async (draft: ComboDraft, heroFile?: File | null) => {
      if (rejectFile(heroFile)) return false;
      // Mint the id up front so the hero can be attached in the same write —
      // a combo saved without its photo would flash a placeholder on the store.
      const id = doc.newId();
      const add = (d: Parameters<typeof doc.addCombo>[0]) => doc.addCombo(d, draft, () => id);

      const outcome = heroFile
        ? await session.mutateWithImage(heroFile, (d, saved) =>
            doc.chain(add(d), (next) => doc.setHeroImage(next, id, saved.id)),
          )
        : await session.mutate(add);

      if (!report(outcome)) return false;
      toast({ title: 'تمت الإضافة', description: 'تم إنشاء الكومبو بنجاح' });
      return true;
    },
    [rejectFile],
  );

  const saveCombo = useCallback(
    async (id: string, draft: ComboDraft, heroFile?: File | null) => {
      if (rejectFile(heroFile)) return false;
      const update = (d: Parameters<typeof doc.updateCombo>[0]) => doc.updateCombo(d, id, draft);

      const outcome = heroFile
        ? await session.mutateWithImage(heroFile, (d, saved) =>
            doc.chain(update(d), (next) => doc.setHeroImage(next, id, saved.id)),
          )
        : await session.mutate(update);

      if (!report(outcome)) return false;
      toast({ title: 'تم التحديث', description: 'تم حفظ تعديلات الكومبو' });
      return true;
    },
    [rejectFile],
  );

  const removeCombo = useCallback(async (id: string) => {
    const outcome = await session.mutate((d) => doc.deleteCombo(d, id));
    if (!report(outcome)) return false;
    toast({ title: 'تم الحذف', description: 'تم حذف الكومبو' });
    return true;
  }, []);

  const clearHero = useCallback(
    async (id: string) => report(await session.mutate((d) => doc.clearHeroImage(d, id))),
    [],
  );

  const makeBest = useCallback(
    async (id: string | null) => report(await session.mutate((d) => doc.setBest(d, id))),
    [],
  );

  const setActive = useCallback(
    async (id: string, isActive: boolean) =>
      report(await session.mutate((d) => doc.setActive(d, id, isActive))),
    [],
  );

  const reorder = useCallback(
    async (orderedIds: string[]) =>
      report(await session.mutate((d) => doc.reorderCombos(d, orderedIds))),
    [],
  );

  const reload = useCallback(() => void session.reloadSession(), []);

  const resetAll = useCallback(async () => {
    const outcome = await session.resetSession();
    if (!report(outcome)) return false;
    toast({ title: 'تمت الاستعادة', description: 'رجعت الكومبوهات للإعدادات الافتراضية' });
    return true;
  }, []);

  return {
    status,
    error,
    combos,
    activeCombos,
    urlFor,
    heroSrcFor,
    createCombo,
    saveCombo,
    removeCombo,
    clearHero,
    makeBest,
    setActive,
    reorder,
    reload,
    resetAll,
  };
}
