import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cake, Plus, Star, Eye } from 'lucide-react';
import { StoreProduct } from '@/hooks/usePublicStore';

interface ProductCardProps {
  product: StoreProduct;
  rating?: { average_rating: number; review_count: number };
  onAddToCart: () => void;
  onViewDetails: () => void;
}

export function ProductCard({ product, rating, onAddToCart, onViewDetails }: ProductCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      {/* Image */}
      <button 
        onClick={onViewDetails}
        className="block aspect-square relative overflow-hidden bg-muted w-full"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Cake className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Category Badge */}
        {product.category && (
          <Badge className="absolute top-2 start-2 text-xs" variant="secondary">
            {product.category}
          </Badge>
        )}

        {/* View Details Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="flex items-center gap-2 text-white text-sm font-medium">
            <Eye className="w-4 h-4" />
            عرض التفاصيل
          </div>
        </div>
      </button>

      {/* Content */}
      <CardContent className="p-3">
        <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-primary font-bold">{product.price} ر.س</span>
          {rating && rating.review_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="w-3 h-3 fill-warning text-warning" />
              <span>{rating.average_rating}</span>
              <span>({rating.review_count})</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Add to Cart */}
      <CardFooter className="p-3 pt-0 gap-2">
        <Button
          className="flex-1"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart();
          }}
        >
          <Plus className="w-4 h-4 me-1" />
          أضف للسلة
        </Button>
      </CardFooter>
    </Card>
  );
}
