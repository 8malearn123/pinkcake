import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Star, Loader2, User } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ProductReview {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  customer_name: string;
}

interface ProductReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
}

export function ProductReviewDialog({
  open,
  onOpenChange,
  productId,
  productName,
}: ProductReviewDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  // Fetch reviews for this product
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_product_reviews', {
        _product_id: productId,
      });
      if (error) throw error;
      return data as ProductReview[];
    },
    enabled: open,
  });

  // Fetch user's existing review
  const { data: myReview } = useQuery({
    queryKey: ['my-product-review', productId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_product_review', {
        _product_id: productId,
      });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: open && !!user,
  });

  // Set initial values from existing review
  useState(() => {
    if (myReview) {
      setRating(myReview.rating);
      setReviewText(myReview.review_text || '');
    }
  });

  // Submit review mutation
  const submitReview = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_product_review', {
        _product_id: productId,
        _rating: rating,
        _review_text: reviewText || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['my-product-review', productId] });
      queryClient.invalidateQueries({ queryKey: ['product-ratings'] });
      toast({
        title: 'تم حفظ التقييم',
        description: 'شكراً لمشاركتك رأيك!',
      });
      setRating(0);
      setReviewText('');
    },
    onError: (error: Error) => {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: 'يرجى اختيار تقييم',
        variant: 'destructive',
      });
      return;
    }
    submitReview.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تقييمات ومراجعات</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Review Form */}
          {user && (
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <h4 className="font-medium text-sm">
                {myReview ? 'تعديل تقييمك' : 'أضف تقييمك'}
              </h4>
              
              {/* Star Rating */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'fill-warning text-warning'
                          : 'fill-muted text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Review Text */}
              <Textarea
                placeholder="اكتب رأيك في المنتج (اختياري)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
                maxLength={500}
              />

              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || submitReview.isPending}
                size="sm"
              >
                {submitReview.isPending && (
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                )}
                {myReview ? 'تحديث التقييم' : 'إرسال التقييم'}
              </Button>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-3">
            <h4 className="font-medium">
              المراجعات ({reviews?.length || 0})
            </h4>

            {reviewsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">
                          {review.customer_name}
                        </span>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${
                              star <= review.rating
                                ? 'fill-warning text-warning'
                                : 'fill-muted text-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-muted-foreground">
                        {review.review_text}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), 'd MMMM yyyy', {
                        locale: ar,
                      })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد مراجعات بعد. كن أول من يقيّم هذا المنتج!
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
