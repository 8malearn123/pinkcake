import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * The code-entry form — extracted so it can be the whole page when /track has no
 * `?code=`, and a quiet bottom disclosure when it does.
 *
 * Most customers arrive from a WhatsApp/SMS deep link with the code already in
 * the URL, so making this the hero of every visit put a form in front of an
 * answer we already had.
 */
export function TrackCodeForm({
  initialCode,
  autoFocus,
  pending,
  /** Drops to `outlineBrand` where the page already carries an anchor CTA. */
  submitVariant = 'brand',
  onSubmit,
  className,
}: {
  initialCode?: string;
  autoFocus?: boolean;
  pending?: boolean;
  submitVariant?: 'brand' | 'outlineBrand';
  onSubmit: (code: string) => void;
  className?: string;
}) {
  const [code, setCode] = useState(initialCode ?? '');

  return (
    <form
      className={cn(className)}
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = code.trim();
        if (trimmed) onSubmit(trimmed);
      }}
    >
      <Label htmlFor="track-code" className="text-sm font-bold">
        رمز التتبّع
      </Label>
      <Input
        id="track-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        dir="ltr"
        inputMode="text"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder="TRK1000"
        className="mt-2 h-12 rounded-xl text-center text-lg tracking-widest"
      />
      <Button
        type="submit"
        variant={submitVariant}
        size="cta"
        className="mt-3 w-full"
        disabled={pending || !code.trim()}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        تتبّع طلبي
      </Button>
    </form>
  );
}
