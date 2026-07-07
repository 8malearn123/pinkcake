import { useState, useEffect, useMemo, Fragment } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductsTable } from '@/components/products/ProductsTable';
import { ProductForm } from '@/components/products/ProductForm';
import { PageHeader, LoadingState, ErrorState } from '@/components/ds';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useReorderProducts,
} from '@/hooks/useProducts';
import { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { Package, Plus, Search, Tag, X, ArrowUpDown, GripVertical, ChevronLeft, CheckCircle2, XCircle } from 'lucide-react';

type Product = Tables<'products'>;
type SortOption = 'custom' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc';

export default function Products() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('custom');

  const { data: products, isLoading, error } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const reorderProducts = useReorderProducts();

  // Reset form when dialog closes
  useEffect(() => {
    if (!isFormOpen) {
      setSelectedProduct(null);
    }
  }, [isFormOpen]);

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleSubmit = (values: Omit<Product, 'id' | 'created_at'>) => {
    if (selectedProduct) {
      updateProduct.mutate(
        { id: selectedProduct.id, ...values },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createProduct.mutate(values, { onSuccess: () => setIsFormOpen(false) });
    }
  };

  // Extract unique categories
  const categories = useMemo(() => {
    if (!products) return [];
    return [...new Set(
      products
        .map((p) => p.category)
        .filter((c): c is string => !!c && c.trim() !== '')
    )].sort();
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products?.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    }) || [];

    // Sort products
    if (sortBy !== 'custom') {
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case 'name_asc':
            return a.name.localeCompare(b.name, 'ar');
          case 'name_desc':
            return b.name.localeCompare(a.name, 'ar');
          case 'price_asc':
            return a.price - b.price;
          case 'price_desc':
            return b.price - a.price;
          case 'date_asc':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'date_desc':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          default:
            return 0;
        }
      });
    }
    // For 'custom', products are already sorted by display_order from the query

    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const stats = {
    total: products?.length || 0,
    active: products?.filter((p) => p.is_active).length || 0,
    inactive: products?.filter((p) => !p.is_active).length || 0,
  };

  // Product availability pipeline: available for sale → unavailable.
  const pipeline = [
    { key: 'active', label: 'متاح للبيع', value: stats.active, icon: CheckCircle2, box: 'bg-success/10 text-success', text: 'text-success' },
    { key: 'inactive', label: 'غير متاح', value: stats.inactive, icon: XCircle, box: 'bg-warning/10 text-warning', text: 'text-warning' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="إدارة المنتجات"
          description="إضافة وتعديل وحذف الحلويات"
          icon={Package}
          actions={
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة منتج
            </Button>
          }
        />

        {/* Command bar — total (hero) + the product-availability pipeline */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="flex flex-col lg:flex-row">
            <div className="flex items-center gap-3 p-5 bg-primary/[0.04] border-b lg:border-b-0 lg:border-e border-border/60 shrink-0">
              <div className="w-12 h-12 rounded-xl gradient-pink shadow-warm flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1.5">إجمالي المنتجات</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-1 p-4 flex-1 overflow-x-auto">
              {pipeline.map((stage, i) => (
                <Fragment key={stage.key}>
                  <div className="flex flex-col items-center gap-1.5 px-2 shrink-0">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stage.box)}>
                      <stage.icon className="w-5 h-5" />
                    </div>
                    <p className={cn('text-xl font-bold leading-none', stage.text)}>{stage.value}</p>
                    <p className="text-xs text-muted-foreground text-center leading-tight whitespace-nowrap">{stage.label}</p>
                  </div>
                  {i < pipeline.length - 1 && <ChevronLeft className="w-4 h-4 text-muted-foreground/30 shrink-0" />}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="البحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-52">
              <ArrowUpDown className="w-4 h-4 me-2" />
              <SelectValue placeholder="الترتيب" />
            </SelectTrigger>
            <SelectContent className="bg-popover border shadow-md">
              <SelectItem value="custom">
                <span className="flex items-center gap-1">
                  <GripVertical className="w-3 h-3" />
                  ترتيب مخصص (سحب)
                </span>
              </SelectItem>
              <SelectItem value="date_desc">الأحدث أولاً</SelectItem>
              <SelectItem value="date_asc">الأقدم أولاً</SelectItem>
              <SelectItem value="name_asc">الاسم (أ-ي)</SelectItem>
              <SelectItem value="name_desc">الاسم (ي-أ)</SelectItem>
              <SelectItem value="price_asc">السعر (الأقل)</SelectItem>
              <SelectItem value="price_desc">السعر (الأعلى)</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-muted-foreground" />
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() =>
                    setSelectedCategory(selectedCategory === category ? null : category)
                  }
                >
                  {category}
                  {selectedCategory === category && (
                    <X className="w-3 h-3 ms-1" />
                  )}
                </Badge>
              ))}
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="h-6 px-2 text-xs"
                >
                  مسح الفلتر
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingState label="جاري تحميل المنتجات..." />
        ) : error ? (
          <ErrorState title="حدث خطأ في تحميل المنتجات" description={error.message} />
        ) : (
          <ProductsTable
            products={filteredAndSortedProducts}
            onEdit={handleEdit}
            onDelete={(id) => deleteProduct.mutate(id)}
            isDeleting={deleteProduct.isPending}
            onReorder={sortBy === 'custom' && !searchQuery && !selectedCategory ? (updates) => reorderProducts.mutate(updates) : undefined}
            isReordering={reorderProducts.isPending}
          />
        )}

        {/* Form Dialog */}
        <ProductForm
          key={selectedProduct?.id || 'new'}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          product={selectedProduct}
          onSubmit={handleSubmit}
          isLoading={createProduct.isPending || updateProduct.isPending}
        />
      </div>
    </MainLayout>
  );
}
