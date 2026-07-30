import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { toast } from '@/hooks/use-toast';
import * as C from '@/lib/cakeCatalog/catalog';
import * as session from '@/lib/cakeCatalog/session';
import { validateImageFile } from '@/lib/cakeCatalog/validate';
import type { MutationOutcome } from '@/lib/cakeCatalog/session';
import type { Catalog, CatalogCake } from '@/lib/cakeCatalog/types';

/**
 * Cake catalog state for the admin studio.
 *
 * A Context rather than react-query on purpose: every browser-local store in
 * this app is a Context (cart, wishlist, settings), react-query here means
 * Supabase — and, decisively, the global `gcTime: 5min` would evict the cache
 * and strand hundreds of live object URLs.
 *
 * The catalog itself lives in `lib/cakeCatalog/session`, not in this component:
 * the provider is mounted by a lazily-routed page, so it unmounts whenever the
 * user navigates away, and mutations must be ordered against each other rather
 * than against whatever a render happened to close over. This file is the
 * React binding and the Arabic messaging; the session owns the data.
 */

export type CakeDesignTab = 'add' | 'levels' | 'library';

interface CakeCatalogValue {
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  catalog: Catalog;
  urls: Record<string, string>;
  urlFor: (imageId: string | null | undefined) => string | undefined;
  hasUrl: (imageId: string) => boolean;

  /** Derived once per catalog change — never recompute these per row. */
  perCakeTotal: number;
  fillHistogram: Record<string, number>;

  tab: CakeDesignTab;
  setTab: (tab: CakeDesignTab) => void;
  workingCakeId: string | null;
  openCake: (cakeId: string | null) => void;

  reload: () => void;
  resetAll: () => Promise<void>;

  createCake: (
    input: Pick<CatalogCake, 'name' | 'basePrice' | 'serves' | 'leadTime'>,
    previewFile: File,
  ) => Promise<boolean>;
  updateCakeInfo: (
    cakeId: string,
    patch: Partial<Pick<CatalogCake, 'name' | 'basePrice' | 'serves' | 'leadTime'>>,
  ) => Promise<void>;
  removeCake: (cakeId: string) => Promise<void>;
  choosePreview: (cakeId: string, imageId: string) => Promise<void>;
  uploadPreview: (cakeId: string, file: File) => Promise<boolean>;

  saveVariantImage: (cakeId: string, path: string[], file: File) => Promise<boolean>;
  removeVariantImage: (imageId: string) => Promise<void>;

  addLevel: (name: string) => Promise<void>;
  renameLevel: (index: number, name: string) => Promise<void>;
  removeLevel: (index: number) => Promise<void>;
  reorderLevel: (from: number, to: number) => Promise<void>;

  addValue: (levelIndex: number, name: string) => Promise<boolean>;
  renameValue: (levelIndex: number, valueId: string, name: string) => Promise<boolean>;
  setValuePrice: (levelIndex: number, valueId: string, priceDelta: number) => Promise<void>;
  removeValue: (levelIndex: number, valueId: string) => Promise<void>;
  setValueReference: (levelIndex: number, valueId: string, file: File | null) => Promise<boolean>;
}

const CakeCatalogContext = createContext<CakeCatalogValue | null>(null);

function reportFailure(outcome: MutationOutcome) {
  if (outcome.ok) return true;
  if (outcome.reason === 'storage') {
    toast({
      title: 'تعذّر الحفظ',
      description: 'قد تكون مساحة المتصفح ممتلئة — احذف بعض الصور ثم أعد المحاولة.',
      variant: 'destructive',
    });
  } else {
    toast({
      title: 'تعذّر حفظ التغيير',
      description:
        outcome.error instanceof Error ? outcome.error.message : 'حدث خطأ غير متوقع',
      variant: 'destructive',
    });
  }
  return false;
}

export function CakeCatalogProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [tab, setTab] = useState<CakeDesignTab>('add');
  const [workingCakeId, setWorkingCakeId] = useState<string | null>(null);
  const [repairAnnounced, setRepairAnnounced] = useState(false);

  useEffect(() => {
    void session.ensureLoaded();
  }, []);

  useEffect(() => {
    if (!snapshot.repaired || repairAnnounced) return;
    setRepairAnnounced(true);
    toast({
      title: 'تم إصلاح المكتبة',
      description: 'حُذفت سجلات صور لم تعد موجودة في هذا المتصفح.',
    });
  }, [snapshot.repaired, repairAnnounced]);

  const { catalog, urls, status, error } = snapshot;

  const urlFor = useCallback(
    (imageId: string | null | undefined) => (imageId ? urls[imageId] : undefined),
    [urls],
  );
  const hasUrl = useCallback((imageId: string) => !!urls[imageId], [urls]);

  const fillHistogram = useMemo(() => C.prefixFillHistogram(catalog.images), [catalog.images]);
  const perCakeTotal = useMemo(() => C.perCakeTotal(catalog.levels), [catalog.levels]);

  /** Validate before anything touches storage; the session does the rest. */
  const withImage = useCallback(
    async (
      file: File,
      build: Parameters<typeof session.mutateWithImage>[1],
    ): Promise<boolean> => {
      const rejection = validateImageFile(file);
      if (rejection) {
        toast({ ...rejection, variant: 'destructive' });
        return false;
      }
      return reportFailure(await session.mutateWithImage(file, build));
    },
    [],
  );

  const value = useMemo<CakeCatalogValue>(() => {
    const run = async (build: Parameters<typeof session.mutate>[0]) => {
      reportFailure(await session.mutate(build));
    };

    return {
      status,
      error,
      catalog,
      urls,
      urlFor,
      hasUrl,
      perCakeTotal,
      fillHistogram,
      tab,
      setTab,
      workingCakeId,
      openCake: (cakeId) => {
        setWorkingCakeId(cakeId);
        setTab('add');
      },
      reload: () => void session.reloadSession(),

      async resetAll() {
        if (!reportFailure(await session.resetSession())) return;
        setWorkingCakeId(null);
        toast({ title: 'تمت إعادة التعيين', description: 'رجعت المكتبة إلى البيانات التجريبية.' });
      },

      async createCake(input, previewFile) {
        const id = C.newId();
        const ok = await withImage(previewFile, (current, saved) =>
          C.addCake(current, { ...input, previewImageId: saved.id }, id),
        );
        if (!ok) return false;
        setWorkingCakeId(id);
        toast({
          title: `أُنشئت ${input.name}`,
          description: 'اسحب الصور على التشكيلات بالأسفل لتعبئة المكتبة.',
        });
        return true;
      },

      updateCakeInfo: (cakeId, patch) => run((c) => C.updateCake(c, cakeId, patch)),

      async removeCake(cakeId) {
        const name = catalog.cakes.find((c) => c.id === cakeId)?.name ?? '';
        if (!reportFailure(await session.mutate((c) => C.deleteCake(c, cakeId)))) return;
        setWorkingCakeId((current) => (current === cakeId ? null : current));
        toast({ title: 'حُذفت الكيكة', description: `${name} وكل صورها.` });
      },

      choosePreview: (cakeId, imageId) => run((c) => C.setPreview(c, cakeId, imageId)),

      uploadPreview: (cakeId, file) =>
        withImage(file, (current, saved) => C.setPreview(current, cakeId, saved.id)),

      async saveVariantImage(cakeId, path, file) {
        const ok = await withImage(file, (current, saved) =>
          C.upsertImage(current, {
            id: saved.id,
            cakeId,
            path,
            ...saved.meta,
            createdAt: Date.now(),
          }),
        );
        if (ok) toast({ title: 'تم الحفظ', description: 'أُضيفت الصورة إلى هذه التشكيلة.' });
        return ok;
      },

      removeVariantImage: (imageId) => run((c) => C.removeImage(c, imageId)),

      async addLevel(name) {
        const trimmed = name.trim();
        if (!trimmed) return;
        if (!reportFailure(await session.mutate((c) => C.addLevel(c, trimmed)))) return;
        toast({ title: `أُضيف مستوى ${trimmed}`, description: 'أضف خياراته من هنا.' });
      },

      renameLevel: (index, name) => run((c) => C.renameLevel(c, index, name)),

      async removeLevel(index) {
        const name = catalog.levels[index]?.name ?? '';
        if (!reportFailure(await session.mutate((c) => C.deleteLevel(c, index)))) return;
        toast({ title: 'حُذف المستوى', description: `${name} وكل الصور الأعمق منه.` });
      },

      async reorderLevel(from, to) {
        if (!reportFailure(await session.mutate((c) => C.moveLevel(c, from, to)))) return;
        toast({ title: 'تغيّر الترتيب', description: 'حُذفت الصور التي لم يعد لها معنى.' });
      },

      async addValue(levelIndex, name) {
        // Uniqueness is re-checked inside the mutation against the live catalog;
        // this pre-check only decides whether to explain the rejection.
        let rejected = false;
        const outcome = await session.mutate((c) => {
          rejected = C.findDuplicateValueName(c.levels[levelIndex], name);
          return rejected ? { catalog: c, deadImageIds: [], clearedPreviewCakeIds: [] } : C.addValue(c, levelIndex, name);
        });
        if (rejected) {
          toast({
            title: 'الاسم مستخدم',
            description: `«${name.trim()}» موجود مسبقاً في ${catalog.levels[levelIndex]?.name ?? ''}.`,
            variant: 'destructive',
          });
          return false;
        }
        return reportFailure(outcome);
      },

      async renameValue(levelIndex, valueId, name) {
        let rejected = false;
        const outcome = await session.mutate((c) => {
          rejected = C.findDuplicateValueName(c.levels[levelIndex], name, valueId);
          return rejected
            ? { catalog: c, deadImageIds: [], clearedPreviewCakeIds: [] }
            : C.renameValue(c, levelIndex, valueId, name);
        });
        if (rejected) {
          toast({
            title: 'الاسم مستخدم',
            description: `«${name.trim()}» موجود مسبقاً في ${catalog.levels[levelIndex]?.name ?? ''}.`,
            variant: 'destructive',
          });
          return false;
        }
        return reportFailure(outcome);
      },

      setValuePrice: (levelIndex, valueId, priceDelta) =>
        run((c) => C.setValuePriceDelta(c, levelIndex, valueId, priceDelta)),

      async removeValue(levelIndex, valueId) {
        const name = catalog.levels[levelIndex]?.values.find((v) => v.id === valueId)?.name ?? '';
        if (!reportFailure(await session.mutate((c) => C.deleteValue(c, levelIndex, valueId)))) return;
        toast({ title: 'حُذف الخيار', description: `${name} — من كل الكيكات.` });
      },

      async setValueReference(levelIndex, valueId, file) {
        if (!file) {
          return reportFailure(
            await session.mutate((c) => C.setValueReferenceImage(c, levelIndex, valueId, null)),
          );
        }
        return withImage(file, (current, saved) =>
          C.setValueReferenceImage(current, levelIndex, valueId, saved.id),
        );
      },
    };
  }, [
    catalog,
    error,
    fillHistogram,
    hasUrl,
    perCakeTotal,
    status,
    tab,
    urlFor,
    urls,
    withImage,
    workingCakeId,
  ]);

  return <CakeCatalogContext.Provider value={value}>{children}</CakeCatalogContext.Provider>;
}

export function useCakeCatalog(): CakeCatalogValue {
  const context = useContext(CakeCatalogContext);
  if (!context) throw new Error('useCakeCatalog must be used inside CakeCatalogProvider');
  return context;
}
