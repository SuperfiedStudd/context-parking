import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SetupBannerProps {
  onOpenWizard: () => void;
}

export default function SetupBanner({ onOpenWizard }: SetupBannerProps) {
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Setup required for AI summaries</span>
      </div>
      <Button size="sm" variant="secondary" onClick={onOpenWizard} className="text-xs">
        Complete Setup
      </Button>
    </div>
  );
}
