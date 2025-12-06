import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/types/csr';

interface StateLocationSelectorProps {
  projects: Project[];
  type: 'state' | 'location';
  onSelect: (value: string) => void;
}

export default function StateLocationSelector({ projects, type, onSelect }: StateLocationSelectorProps) {
  const items = type === 'state'
    ? Array.from(new Set(projects.map(p => p.state).filter(Boolean))).sort()
    : Array.from(new Set(projects.map(p => p.location).filter(Boolean))).sort();

  const getItemCount = (item: string) => {
    return projects.filter(p => type === 'state' ? p.state === item : p.location === item).length;
  };

  return (
    <ScrollArea className="max-h-[60vh] pr-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => {
          const count = getItemCount(item);
          return (
            <div
              key={item}
              className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors group"
              onClick={() => onSelect(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(item);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    {item}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {count} project{count !== 1 ? 's' : ''}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {count}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
