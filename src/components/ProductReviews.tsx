import { useCallback, useEffect, useState } from 'react';
import { Star, ThumbsUp, User, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  title: string | null;
  content: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_1: number;
  rating_2: number;
  rating_3: number;
  rating_4: number;
  rating_5: number;
}

interface ProductReviewsProps {
  productId: string;
  productHandle: string;
  productTitle: string;
}

const StarRating = ({ rating, size = 'sm', interactive = false, onRate }: { 
  rating: number; 
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6'
  };

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= (interactive ? (hoverRating || rating) : rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30'
          } ${interactive ? 'cursor-pointer transition-colors' : ''}`}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && onRate?.(star)}
        />
      ))}
    </div>
  );
};

// Rate limiting constants
const REVIEW_COOLDOWN_MS = 3600000; // 1 hour
const HELPFUL_COOLDOWN_MS = 60000; // 1 minute per review

const getReviewCooldownKey = (productHandle: string) => `review_cooldown_${productHandle}`;
const getHelpfulCooldownKey = (reviewId: string) => `helpful_cooldown_${reviewId}`;

const canSubmitReview = (productHandle: string): boolean => {
  const key = getReviewCooldownKey(productHandle);
  const lastSubmit = localStorage.getItem(key);
  if (lastSubmit && Date.now() - parseInt(lastSubmit) < REVIEW_COOLDOWN_MS) {
    return false;
  }
  return true;
};

const setReviewCooldown = (productHandle: string) => {
  const key = getReviewCooldownKey(productHandle);
  localStorage.setItem(key, Date.now().toString());
};

const canMarkHelpful = (reviewId: string): boolean => {
  const key = getHelpfulCooldownKey(reviewId);
  const lastMark = localStorage.getItem(key);
  if (lastMark && Date.now() - parseInt(lastMark) < HELPFUL_COOLDOWN_MS) {
    return false;
  }
  return true;
};

const setHelpfulCooldown = (reviewId: string) => {
  const key = getHelpfulCooldownKey(reviewId);
  localStorage.setItem(key, Date.now().toString());
};

export const ProductReviews = ({ productId, productHandle, productTitle }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  
  // Form state - removed email field for privacy
  const [formRating, setFormRating] = useState(5);
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      // Use the secure RPC function that excludes customer_email
      const { data, error } = await supabase
        .rpc('get_approved_reviews', { p_product_handle: productHandle });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  }, [productHandle]);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_product_review_stats', { p_handle: productHandle });

      if (error) throw error;
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
  }, [productHandle]);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [fetchReviews, fetchStats]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formName.trim() || !formContent.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Rate limiting check
    if (!canSubmitReview(productHandle)) {
      toast.error('You can only submit one review per product per hour. Please try again later.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          product_handle: productHandle,
          customer_name: formName.trim(),
          rating: formRating,
          title: formTitle.trim() || null,
          content: formContent.trim(),
        });

      if (error) throw error;

      // Set rate limit cooldown
      setReviewCooldown(productHandle);

      toast.success('Review submitted successfully!');
      setShowWriteReview(false);
      setFormRating(5);
      setFormName('');
      setFormTitle('');
      setFormContent('');
      
      // Refresh reviews
      fetchReviews();
      fetchStats();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    // Rate limiting check for helpful button
    if (!canMarkHelpful(reviewId)) {
      toast.error('You already marked this review as helpful');
      return;
    }

    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      // Use the secure RPC function to increment helpful count
      const { error } = await supabase
        .rpc('increment_review_helpful', { p_review_id: reviewId });

      if (error) throw error;
      
      // Set cooldown to prevent spam
      setHelpfulCooldown(reviewId);
      
      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
      ));
      toast.success('Thanks for your feedback!');
    } catch (error) {
      console.error('Error updating helpful count:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="py-8 border-t border-border">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 border-t border-border">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
        <div>
          <h2 className="text-xl font-display uppercase tracking-widest mb-2">
            Customer Reviews
          </h2>
          {stats && stats.total_reviews > 0 && (
            <div className="flex items-center gap-3">
              <StarRating rating={Math.round(Number(stats.average_rating))} size="md" />
              <span className="text-lg font-medium">{Number(stats.average_rating).toFixed(1)}</span>
              <span className="text-muted-foreground">
                Based on {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        
        <Dialog open={showWriteReview} onOpenChange={setShowWriteReview}>
          <DialogTrigger asChild>
            <Button variant="outline" className="uppercase tracking-widest text-xs">
              Write a Review
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display uppercase tracking-widest">
                Write a Review
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitReview} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rating *</label>
                <StarRating 
                  rating={formRating} 
                  size="lg" 
                  interactive 
                  onRate={setFormRating} 
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Your Name *</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={100}
                  required
                />
                <span className="text-xs text-muted-foreground mt-1">{formName.length}/100</span>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Review Title</label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Sum up your review"
                  maxLength={150}
                />
                <span className="text-xs text-muted-foreground mt-1">{formTitle.length}/150</span>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Your Review *</label>
                <Textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Share your experience with this product"
                  rows={4}
                  maxLength={2000}
                  required
                />
                <span className="text-xs text-muted-foreground mt-1">{formContent.length}/2000</span>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowWriteReview(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rating Breakdown */}
      {stats && stats.total_reviews > 0 && (
        <div className="grid md:grid-cols-2 gap-8 mb-8 p-6 bg-secondary/20 rounded-lg">
          <div>
            <div className="text-center md:text-left">
              <div className="text-5xl font-display mb-2">{Number(stats.average_rating).toFixed(1)}</div>
              <StarRating rating={Math.round(Number(stats.average_rating))} size="md" />
              <p className="text-sm text-muted-foreground mt-2">
                {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = Number(stats[`rating_${star}` as keyof ReviewStats]) || 0;
              const percentage = stats.total_reviews > 0 
                ? (count / Number(stats.total_reviews)) * 100 
                : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm w-12">{star} star</span>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-secondary/10 rounded-lg">
          <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">No reviews yet. Be the first to review this product!</p>
          <Button variant="outline" onClick={() => setShowWriteReview(true)}>
            Write a Review
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.slice(0, visibleCount).map((review) => (
            <div key={review.id} className="border-b border-border pb-6 last:border-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={review.rating} size="sm" />
                    {review.is_verified_purchase && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  {review.title && (
                    <h4 className="font-medium break-words">{review.title}</h4>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(review.created_at)}
                </span>
              </div>
              
              <p className="text-sm text-foreground/80 mb-3 leading-relaxed break-words">
                {review.content}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{review.customer_name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => handleHelpful(review.id)}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Helpful ({review.helpful_count})
                </Button>
              </div>
            </div>
          ))}
          
          {reviews.length > visibleCount && (
            <div className="text-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => setVisibleCount(prev => prev + 5)}
                className="uppercase tracking-widest text-xs"
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Load More Reviews
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
