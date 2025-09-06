import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserStatisticsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;
  description?: string;
  className?: string;
  showProgress?: boolean;
}

export function UserStatisticsCard({
  title,
  value,
  icon,
  trend,
  description,
  className,
  showProgress
}: UserStatisticsCardProps) {
  const progressValue = typeof value === 'number' ? Math.min(value, 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className={cn("h-4 w-4 text-muted-foreground", className)}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {showProgress && (
          <Progress value={progressValue} className="mt-2 h-2" />
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend !== undefined && trend !== 0 && (
          <div className={cn(
            "flex items-center gap-1 mt-2 text-xs",
            trend > 0 ? "text-green-600" : "text-red-600"
          )}>
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}