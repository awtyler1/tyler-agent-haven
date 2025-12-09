import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ContractingApplication, Carrier, SelectedCarrier, US_STATES } from '@/types/contracting';
import { Building2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CarrierSelectionStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, type: string) => Promise<string | null>;
  onBack: () => void;
  onContinue: () => void;
}

export function CarrierSelectionStep({ application, onUpdate, onUpload, onBack, onContinue }: CarrierSelectionStepProps) {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const corpResInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCarriers = async () => {
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (!error && data) {
        setCarriers(data as Carrier[]);
      }
      setLoading(false);
    };
    fetchCarriers();
  }, []);

  const selectedCarriers = (application.selected_carriers as SelectedCarrier[]) || [];

  const isCarrierSelected = (carrierId: string) => {
    return selectedCarriers.some(c => c.carrier_id === carrierId);
  };

  const toggleCarrier = (carrier: Carrier, checked: boolean) => {
    if (checked) {
      const newSelection: SelectedCarrier = {
        carrier_id: carrier.id,
        carrier_name: carrier.name,
        non_resident_states: [],
      };
      onUpdate('selected_carriers', [...selectedCarriers, newSelection]);
    } else {
      onUpdate('selected_carriers', selectedCarriers.filter(c => c.carrier_id !== carrier.id));
    }
  };

  const updateCarrierStates = (carrierId: string, states: string[]) => {
    const updated = selectedCarriers.map(c => 
      c.carrier_id === carrierId ? { ...c, non_resident_states: states } : c
    );
    onUpdate('selected_carriers', updated);
  };

  const handleFileUpload = async (file: File) => {
    await onUpload(file, 'corporate_resolution');
  };

  // Check if any selected carrier requires corporate resolution
  const needsCorporateResolution = application.is_corporation && 
    selectedCarriers.some(sc => {
      const carrier = carriers.find(c => c.id === sc.carrier_id);
      return carrier?.requires_corporate_resolution;
    });

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-4 w-4" />
            Carrier Selection
          </CardTitle>
          <CardDescription className="text-sm">
            Select the carriers you want to be contracted with. Some carriers may charge appointment fees.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-4">
          {/* Corporation checkbox */}
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <Checkbox
              id="is_corporation"
              checked={application.is_corporation}
              onCheckedChange={checked => onUpdate('is_corporation', !!checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="is_corporation" className="text-sm font-normal cursor-pointer">
              I am applying as a corporation
            </Label>
          </div>

          {/* Carriers list */}
          {loading ? (
            <div className="text-center py-4 text-sm text-muted-foreground">Loading carriers...</div>
          ) : (
            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {carriers.map(carrier => {
                const selected = isCarrierSelected(carrier.id);
                const selectedCarrier = selectedCarriers.find(c => c.carrier_id === carrier.id);
                
                return (
                  <div key={carrier.id} className="p-2 hover:bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`carrier_${carrier.id}`}
                        checked={selected}
                        onCheckedChange={checked => toggleCarrier(carrier, !!checked)}
                        className="h-4 w-4"
                      />
                      <Label 
                        htmlFor={`carrier_${carrier.id}`} 
                        className="flex-1 text-sm font-normal cursor-pointer"
                      >
                        {carrier.name}
                      </Label>
                      
                      {selected && carrier.requires_non_resident_states && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Non-res states:</span>
                          <Input
                            value={selectedCarrier?.non_resident_states?.join(', ') || ''}
                            onChange={e => {
                              const states = e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                              updateCarrierStates(carrier.id, states);
                            }}
                            placeholder="KY, TN, OH"
                            className="h-6 text-xs w-32"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Corporate resolution upload */}
          {needsCorporateResolution && (
            <div className="p-3 border rounded-lg bg-amber-50 border-amber-200">
              <p className="text-xs text-amber-800 mb-2">
                Since you're applying as a corporation and selected a carrier requiring it, please upload a corporate resolution or list of authorized signers.
              </p>
              <input
                type="file"
                ref={corpResInputRef}
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => corpResInputRef.current?.click()}
              >
                <Upload className="h-3 w-3 mr-1" />
                {application.uploaded_documents?.corporate_resolution
                  ? '✓ Corporate resolution uploaded'
                  : 'Upload corporate resolution'}
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Selected: {selectedCarriers.length} carrier{selectedCarriers.length !== 1 ? 's' : ''}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onBack} size="sm">
              Back
            </Button>
            <Button onClick={onContinue} size="sm">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
