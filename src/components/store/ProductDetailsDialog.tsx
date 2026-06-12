import { useState, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useProductDetails, ProductOption, ProductOptionValue } from '@/hooks/useProductDetails';
import { Cake, Plus, Minus, ShoppingCart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  onAddToCart: (product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    selectedOptions?: Record<string, string[]>;
  }, quantity: number) => void;
}

export function ProductDetailsDialog({
  open,
  onOpenChange,
  productId,
  onAddToCart,
}: ProductDetailsDialogProps) {
  const { data: product, isLoading } = useProductDetails(productId);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuantity(1);
      setSelectedOptions({});
      setCurrentImageIndex(0);
    }
  }, [open, productId]);

  // Calculate total price based on selected options
  const totalPrice = useMemo(() => {
    if (!product) return 0;
    
    let price = product.price;
    
    if (product.options) {
      product.options.forEach((option: ProductOption) => {
        const selectedValueIds = selectedOptions[option.id] || [];
        if (option.values) {
          option.values.forEach((value: ProductOptionValue) => {
            if (selectedValueIds.includes(value.id)) {
              price += value.price_adjustment;
            }
          });
        }
      });
    }
    
    return price * quantity;
  }, [product, selectedOptions, quantity]);

  const handleOptionChange = (optionId: string, valueId: string, isMultiple: boolean) => {
    setSelectedOptions((prev) => {
      if (isMultiple) {
        const current = prev[optionId] || [];
        if (current.includes(valueId)) {
          return { ...prev, [optionId]: current.filter((id) => id !== valueId) };
        }
        return { ...prev, [optionId]: [...current, valueId] };
      }
      return { ...prev, [optionId]: [valueId] };
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // Validate required options
    const missingRequired = product.options?.filter(
      (opt: ProductOption) => opt.is_required && (!selectedOptions[opt.id] || selectedOptions[opt.id].length === 0)
    );
    
    if (missingRequired && missingRequired.length > 0) {
      return; // Could add toast here
    }

    onAddToCart(
      {
        id: product.id,
        name: product.name,
        price: totalPrice / quantity,
        image_url: product.image_url,
        selectedOptions,
      },
      quantity
    );
    onOpenChange(false);
  };

  // Build image gallery from main image + additional images
  const allImages = useMemo(() => {
    if (!product) return [];
    const images: { url: string; isPrimary: boolean }[] = [];
    
    if (product.image_url) {
      images.push({ url: product.image_url, isPrimary: true });
    }
    
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach((img: { image_url: string; is_primary: boolean }) => {
        if (img.image_url && img.image_url !== product.image_url) {
          images.push({ url: img.image_url, isPrimary: img.is_primary });
        }
      });
    }
    
    return images;
  }, [product]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : product ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>{product.name}</DialogTitle>
              <DialogDescription>{product.description}</DialogDescription>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Image Gallery */}
              <div className="space-y-3">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  {allImages.length > 0 ? (
                    <>
                      <img
                        src={allImages[currentImageIndex]?.url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {allImages.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute end-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute start-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Cake className="w-20 h-20 text-muted-foreground" />
                    </div>
                  )}
                  {product.category && (
                    <Badge className="absolute top-3 start-3" variant="secondary">
                      {product.category}
                    </Badge>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={cn(
                          'w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors',
                          currentImageIndex === idx ? 'border-primary' : 'border-transparent'
                        )}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{product.name}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-2xl font-bold text-primary">
                      {product.price.toFixed(2)} ر.س
                    </span>
                  </div>
                </div>

                {product.description && (
                  <p className="text-muted-foreground">{product.description}</p>
                )}

                {product.rich_description && (
                  <div 
                    className="prose prose-sm max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(product.rich_description, {
                        ALLOWED_TAGS: ['b', 'strong', 'i', 'p', 'ul', 'li', 'br', 'em'],
                        ALLOWED_ATTR: []
                      })
                    }}
                  />
                )}

                {/* Product Options */}
                {product.options && product.options.length > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    {product.options.map((option: ProductOption) => (
                      <div key={option.id} className="space-y-2">
                        <Label className="font-medium">
                          {option.option_name}
                          {option.is_required && <span className="text-destructive ms-1">*</span>}
                        </Label>
                        
                        {option.option_type === 'single' ? (
                          <RadioGroup
                            value={selectedOptions[option.id]?.[0] || ''}
                            onValueChange={(value) => handleOptionChange(option.id, value, false)}
                            className="flex flex-wrap gap-2"
                          >
                            {option.values?.map((value: ProductOptionValue) => (
                              <div key={value.id} className="flex items-center">
                                <RadioGroupItem
                                  value={value.id}
                                  id={value.id}
                                  className="peer sr-only"
                                />
                                <Label
                                  htmlFor={value.id}
                                  className={cn(
                                    'px-3 py-1.5 rounded-full border cursor-pointer transition-colors',
                                    'peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary',
                                    'hover:bg-muted'
                                  )}
                                >
                                  {value.value_name}
                                  {value.price_adjustment !== 0 && (
                                    <span className="ms-1 text-xs">
                                      ({value.price_adjustment > 0 ? '+' : ''}{value.price_adjustment} ر.س)
                                    </span>
                                  )}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {option.values?.map((value: ProductOptionValue) => {
                              const isSelected = selectedOptions[option.id]?.includes(value.id);
                              return (
                                <button
                                  key={value.id}
                                  onClick={() => handleOptionChange(option.id, value.id, true)}
                                  className={cn(
                                    'px-3 py-1.5 rounded-full border transition-colors',
                                    isSelected
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'hover:bg-muted'
                                  )}
                                >
                                  {value.value_name}
                                  {value.price_adjustment !== 0 && (
                                    <span className="ms-1 text-xs">
                                      ({value.price_adjustment > 0 ? '+' : ''}{value.price_adjustment} ر.س)
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Quantity */}
                <div className="flex items-center gap-4 border-t pt-4">
                  <Label className="font-medium">الكمية</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setQuantity((q) => q + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-4 mt-4">
              <div className="w-full flex items-center justify-between gap-4">
                <div className="text-lg font-bold">
                  المجموع: <span className="text-primary">{totalPrice.toFixed(2)} ر.س</span>
                </div>
                <Button onClick={handleAddToCart} className="gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  أضف للسلة
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">المنتج غير موجود</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
