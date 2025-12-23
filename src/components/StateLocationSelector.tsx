import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/types/csr';

const sanitizeBudgetValue = (value?: number) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const formatCurrency = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)} K`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

interface StateLocationSelectorProps {
  projects: Project[];
  type: 'state' | 'location';
  onSelect: (value: string) => void;
  expensesByProject?: Record<string, number>;
}

const isString = (value: string | undefined | null): value is string => Boolean(value);

const getProjectActualUtilized = (project: Project, expensesByProject?: Record<string, number>) => {
  const actual = expensesByProject?.[project.id] ?? 0;
  return actual > 0 ? actual : sanitizeBudgetValue(project.utilized_budget);
};

export default function StateLocationSelector({ projects, type, onSelect, expensesByProject }: StateLocationSelectorProps) {
    const items = type === 'state'
      ? Array.from(new Set(projects.map(p => p.state).filter(isString))).sort()
      : Array.from(new Set(projects.map(p => p.location).filter(isString))).sort();

  const getItemCount = (item: string) => projects.filter(p => type === 'state' ? p.state === item : p.location === item).length;

  const getBudgetStats = (item: string) => {
    const filtered = projects.filter((project) => (type === 'state' ? project.state === item : project.location === item));
    const totals = filtered.reduce(
      (acc, project) => {
        acc.total += sanitizeBudgetValue(project.total_budget);
        acc.utilized += getProjectActualUtilized(project, expensesByProject);
        return acc;
      },
      { total: 0, utilized: 0 }
    );
    return totals;
  };

  return (
    <ScrollArea className="max-h-[60vh] pr-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item) => {
            const count = getItemCount(item);
            const totals = getBudgetStats(item);
            const utilization = totals.total > 0 ? (totals.utilized / totals.total) * 100 : 0;
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
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <p>
                      <span className="font-semibold text-foreground">Total</span>: {formatCurrency(totals.total)}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Utilized</span>: {formatCurrency(totals.utilized)}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Utilization</span>: {utilization.toFixed(1)}%
                    </p>
                  </div>
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
