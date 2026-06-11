import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useReorderProducts,
} from '@/hooks/useProducts';
import { Tables } from '@/integrations/supabase/types';
import { Package, Plus, Search, Loader2, Tag, X, ArrowUpDown, GripVertical } from 'lucide-react';

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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              إدارة المنتجات
            </h1>
            <p className="text-muted-foreground mt-1">إضافة وتعديل وحذف الحلويات</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة منتج
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{stats.total}</p>
                <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-success">{stats.active}</p>
                <p className="text-sm text-muted-foreground">متاح للبيع</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-muted-foreground">{stats.inactive}</p>
                <p className="text-sm text-muted-foreground">غير متاح</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="البحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-52">
              <ArrowUpDown className="w-4 h-4 ml-2" />
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
                    <X className="w-3 h-3 mr-1" />
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">حدث خطأ في تحميل المنتجات</p>
              <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            </CardContent>
          </Card>
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
