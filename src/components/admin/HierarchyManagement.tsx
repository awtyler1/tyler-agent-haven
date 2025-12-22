import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export function HierarchyManagement() {
  return (
    <Card className="border-[#E5E2DB]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gold" />
          Hierarchy Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Manage organizational hierarchy and entity relationships.
        </p>
      </CardContent>
    </Card>
  );
}
