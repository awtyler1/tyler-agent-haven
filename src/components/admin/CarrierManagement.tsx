import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

export function CarrierManagement() {
  return (
    <Card className="border-[#E5E2DB]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-gold" />
          Carrier Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Manage carriers and their configurations.
        </p>
      </CardContent>
    </Card>
  );
}
