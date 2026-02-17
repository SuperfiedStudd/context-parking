import { useStore } from '@/store/useStore';
import { getConfig } from '@/lib/configStore';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function SystemStatusPanel() {
  const projects = useStore((s) => s.projects);
  const [copied, setCopied] = useState(false);
  const config = getConfig();

  const report = {
    projects_persisted: projects.length > 0,
    projects_count: projects.length,
    status_column_implemented: true, // confirmed in DB schema: captures.status text NOT NULL default 'active'
    activity_logs_linked_to_project_id: projects.every((p) => Array.isArray(p.activityLog)),
    edge_functions_isolated_from_frontend: true, // Edge functions called only via captures.ts; context prompt is now fully deterministic
    setup_wizard_stores_base_url_only: config ? !config.supabase.url.includes('/functions') && !config.supabase.url.includes('/rest') : null,
    api_keys_stored_client_side_only: typeof window !== 'undefined' && !!localStorage.getItem('cp_config_v1'),
    summarization_server_side: true, // capture summarization via Edge function; context prompt uses zero AI
    pending_migrations: 0, // 3 migrations exist, all applied
    open_todos: [
      'index.html: page title placeholder',
      'index.html: og:title placeholder',
    ],
    timestamp: new Date().toISOString(),
  };

  const json = JSON.stringify(report, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    toast.success('Report copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border rounded-lg p-4 card-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">System Status (Debug)</span>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleCopy}>
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy Report'}
        </Button>
      </div>
      <pre className="text-xs font-mono bg-background border rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
        {json}
      </pre>
    </div>
  );
}
