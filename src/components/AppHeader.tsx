import { Link, useLocation } from 'react-router-dom';
import { Search, Plus, Settings, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const { searchQuery, setSearchQuery, projects } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSection = location.pathname.startsWith('/capture')
    ? 'Capture'
    : location.pathname.startsWith('/settings')
    ? 'Settings'
    : 'Projects';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setSearchQuery]);

  const filteredProjects = searchQuery
    ? projects.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.objective.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Link to="/projects" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center transition-smooth group-hover:scale-105">
              <Layers className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm hidden sm:inline">Context Parking</span>
          </Link>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-sm font-medium">{currentSection}</span>
        </div>

        {/* Center — Search */}
        <div className="relative flex-1 max-w-md">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-background/50 cursor-pointer transition-smooth hover:border-primary/40"
            onClick={() => {
              setSearchOpen(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
          >
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            {searchOpen ? (
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
                onBlur={() => {
                  setTimeout(() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }, 200);
                }}
              />
            ) : (
              <span className="text-sm text-muted-foreground">
                Search <kbd className="ml-2 text-xs border rounded px-1 py-0.5 bg-muted">⌘K</kbd>
              </span>
            )}
          </div>
          {searchOpen && searchQuery && filteredProjects.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-card border rounded-lg card-shadow p-1 animate-fade-in">
              {filteredProjects.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  className="w-full text-left px-3 py-2 text-sm rounded-md transition-smooth hover:bg-muted"
                  onClick={() => {
                    navigate(`/projects/${p.id}`);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.objective}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/capture')}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Capture</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate('/settings')}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
