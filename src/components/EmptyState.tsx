import { Inbox, Search, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'inbox' | 'search' | 'alert';
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  description,
  icon = 'inbox',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const getIcon = () => {
    switch (icon) {
      case 'search':
        return <Search className="w-16 h-16" />;
      case 'alert':
        return <AlertCircle className="w-16 h-16" />;
      case 'inbox':
      default:
        return <Inbox className="w-16 h-16" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-muted dark:text-muted-foreground mb-4">
        {getIcon()}
      </div>
      <h3 className="text-xl font-semibold text-foreground text-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-muted-foreground text-muted-foreground text-center max-w-sm mb-6">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
