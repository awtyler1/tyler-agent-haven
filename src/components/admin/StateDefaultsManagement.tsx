import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

export function StateDefaultsManagement() {
  return (
    <Card className="border-[#E5E2DB]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gold" />
          State Defaults
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Configure default carriers and settings per state.
        </p>
      </CardContent>
    </Card>
  );
}
