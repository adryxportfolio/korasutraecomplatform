import { Shield, CheckCircle, Lock } from 'lucide-react';

export function SecureCheckoutBadges() {
  return (
    <div className="flex items-center justify-center gap-4 py-3 px-4 bg-secondary/30 rounded-sm border border-border">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Shield className="w-4 h-4 text-green-600" />
        <span className="text-[10px] md:text-xs font-body uppercase tracking-wide">Secure</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-[10px] md:text-xs font-body uppercase tracking-wide">Verified</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Lock className="w-4 h-4 text-green-600" />
        <span className="text-[10px] md:text-xs font-body uppercase tracking-wide">SSL 256-bit</span>
      </div>
    </div>
  );
}
