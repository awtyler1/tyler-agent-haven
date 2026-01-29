import { Link } from 'react-router-dom';
import { Building2, FileText, Zap, Award, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: LucideIcon;
  label: string;
  path: string;
  color: string;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    icon: Building2,
    label: 'Carriers',
    path: '/carrier-resources',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: FileText,
    label: 'Forms',
    path: '/forms-library',
    color: 'bg-slate-50 text-slate-600',
  },
  {
    icon: Zap,
    label: 'Quote Tools',
    path: '/carrier-resources',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Award,
    label: 'Certs',
    path: '/contracting-hub',
    color: 'bg-emerald-50 text-emerald-600',
  },
];

interface QuickActionsProps {
  actions?: QuickAction[];
  isCompact?: boolean;
}

/**
 * QuickActions - 4-column navigation grid
 *
 * Features:
 * - Icon + label for each action
 * - Hover animation (shadow + scale)
 * - Responsive compact mode
 * - Customizable actions via props
 */
export function QuickActions({ actions = DEFAULT_ACTIONS, isCompact = false }: QuickActionsProps) {
  return (
    <div className={cn('grid grid-cols-4', isCompact ? 'gap-3 mb-4' : 'gap-4 mb-8')}>
      {actions.map(({ icon: Icon, label, path, color }) => (
        <Link
          key={label}
          to={path}
          className={cn(
            'bg-white rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100',
            'flex flex-col items-center gap-2',
            'hover:shadow-lg hover:scale-[1.02] transition-all',
            isCompact ? 'p-3' : 'p-4'
          )}
        >
          <div
            className={cn(
              'rounded-xl flex items-center justify-center',
              color,
              isCompact ? 'w-9 h-9' : 'w-11 h-11'
            )}
          >
            <Icon className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} />
          </div>
          <span className="text-xs font-medium text-slate-600">{label}</span>
        </Link>
      ))}
    </div>
  );
}
