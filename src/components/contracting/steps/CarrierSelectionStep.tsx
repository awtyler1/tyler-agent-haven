import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ContractingApplication, Carrier, SelectedCarrier, RECOMMENDED_CARRIER_CODES } from '@/types/contracting';
import { Building2, Upload, Search, ArrowRight, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { WizardProgress } from '../WizardProgress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

interface CarrierSelectionStepProps {
  application: ContractingApplication;
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, type: string) => Promise<string | null>;
  onBack: () => void;
  onContinue: () => void;
  progressProps: ProgressProps;
}

export function CarrierSelectionStep({ application, onUpdate, onUpload, onBack, onContinue, progressProps }: CarrierSelectionStepProps) {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [otherCarrierName, setOtherCarrierName] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const corpResInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCarriers = async () => {
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (!error && data) {
        const mappedCarriers = data.map(c => ({
          ...c,
          product_tags: c.product_tags || [],
          notes: c.notes || null,
        })) as Carrier[];
        setCarriers(mappedCarriers);
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

  const handleFileUpload = async (file: File) => {
    await onUpload(file, 'corporate_resolution');
  };

  // Filter carriers by search (case-insensitive, partial match)
  const filteredCarriers = useMemo(() => {
    if (!searchQuery.trim()) return carriers;
    const query = searchQuery.toLowerCase();
    return carriers.filter(c => c.name.toLowerCase().includes(query));
  }, [carriers, searchQuery]);

  // Split into two columns for display
  const { leftColumn, rightColumn } = useMemo(() => {
    const half = Math.ceil(filteredCarriers.length / 2);
    return {
      leftColumn: filteredCarriers.slice(0, half),
      rightColumn: filteredCarriers.slice(half),
    };
  }, [filteredCarriers]);

  // Check if any selected carrier requires corporate resolution
  const needsCorporateResolution = application.is_corporation && 
    selectedCarriers.some(sc => {
      const carrier = carriers.find(c => c.id === sc.carrier_id);
      return carrier?.requires_corporate_resolution;
    });

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-lg">
        {/* Progress + Header */}
        <div className="pt-3 pb-2 text-center border-b border-border/30">
          <WizardProgress {...progressProps} compact />
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-base font-semibold">Carrier Selection</h2>
          </div>
        </div>

        <CardContent className="py-4 px-5 space-y-3">
          {/* Helper text + Selection count + Actions */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground flex-1">
              Select carriers you plan to work with now. You can update selections anytime.
            </p>
            <div className="flex items-center gap-2">
              {selectedCarriers.length > 0 && (
                <button
                  onClick={() => onUpdate('selected_carriers', [])}
                  className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                >
                  Deselect all
                </button>
              )}
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                {selectedCarriers.length} selected
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search carriers..."
              className="h-9 text-sm pl-10"
            />
          </div>

          {/* Corporation checkbox */}
          <div className="flex items-center gap-2 py-1">
            <Checkbox
              id="is_corporation"
              checked={application.is_corporation}
              onCheckedChange={checked => onUpdate('is_corporation', !!checked)}
              className="h-3.5 w-3.5"
            />
            <Label htmlFor="is_corporation" className="text-xs font-normal cursor-pointer text-muted-foreground">
              I'm applying as a corporation or business entity
            </Label>
          </div>

          {/* Carriers list - Two columns */}
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading carriers...</div>
          ) : (
            <>
              {/* Legend */}
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span>= Recommended carrier</span>
              </div>
              
              <ScrollArea className="h-[260px]">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pr-3">
                  {/* Left column */}
                  <div className="space-y-1">
                    {leftColumn.map(carrier => (
                      <CarrierCheckbox
                        key={carrier.id}
                        carrier={carrier}
                        selected={isCarrierSelected(carrier.id)}
                        onToggle={toggleCarrier}
                        isRecommended={RECOMMENDED_CARRIER_CODES.includes(carrier.code)}
                      />
                    ))}
                  </div>
                  
                  {/* Right column */}
                  <div className="space-y-1">
                    {rightColumn.map(carrier => (
                      <CarrierCheckbox
                        key={carrier.id}
                        carrier={carrier}
                        selected={isCarrierSelected(carrier.id)}
                        onToggle={toggleCarrier}
                        isRecommended={RECOMMENDED_CARRIER_CODES.includes(carrier.code)}
                      />
                    ))}
                  </div>
                </div>

              {filteredCarriers.length === 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground col-span-2">
                  No carriers match your search.
                </div>
              )}

                {/* Other option */}
                <div className="mt-3 pt-3 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="other_carrier"
                      checked={showOtherInput}
                      onCheckedChange={checked => setShowOtherInput(!!checked)}
                      className="h-3.5 w-3.5"
                    />
                    <Label htmlFor="other_carrier" className="text-xs cursor-pointer text-muted-foreground">
                      Other (not listed above)
                    </Label>
                  </div>
                  {showOtherInput && (
                    <Textarea
                      value={otherCarrierName}
                      onChange={e => setOtherCarrierName(e.target.value)}
                      placeholder="Enter carrier name(s) you'd like to request..."
                      className="mt-2 text-xs h-16 resize-none"
                    />
                  )}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Corporate resolution upload */}
          {needsCorporateResolution && (
            <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-800/30">
              <p className="text-xs text-amber-800 dark:text-amber-200 mb-2">
                One or more selected carriers require a corporate resolution for business entities.
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

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
              Back
            </Button>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ArrowRight className="h-3 w-3" />
              <span className="text-foreground/70">Next: Agreements</span>
            </p>
            <Button onClick={onContinue}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Compact carrier checkbox component
function CarrierCheckbox({ 
  carrier, 
  selected, 
  onToggle,
  isRecommended = false
}: {
  carrier: Carrier;
  selected: boolean;
  onToggle: (carrier: Carrier, checked: boolean) => void;
  isRecommended?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 py-1.5 px-2 rounded transition-colors ${
      selected ? 'bg-primary/5' : 'hover:bg-muted/30'
    }`}>
      <Checkbox
        id={`carrier_${carrier.id}`}
        checked={selected}
        onCheckedChange={checked => onToggle(carrier, !!checked)}
        className="h-3.5 w-3.5"
      />
      <Label 
        htmlFor={`carrier_${carrier.id}`} 
        className="text-xs font-normal cursor-pointer truncate flex-1 flex items-center gap-1"
        title={carrier.name}
      >
        {carrier.name}
        {isRecommended && (
          <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />
        )}
      </Label>
    </div>
  );
}
