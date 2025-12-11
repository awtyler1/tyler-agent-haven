import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ContractingApplication, Carrier, SelectedCarrier, PRODUCT_TAGS, RECOMMENDED_CARRIER_CODES } from '@/types/contracting';
import { Building2, Upload, Search, Star, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAllCarriers, setShowAllCarriers] = useState(false);
  const corpResInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCarriers = async () => {
      const { data, error } = await supabase
        .from('carriers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (!error && data) {
        // Map database response to Carrier type, handling missing product_tags
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

  const updateCarrierStates = (carrierId: string, states: string[]) => {
    const updated = selectedCarriers.map(c => 
      c.carrier_id === carrierId ? { ...c, non_resident_states: states } : c
    );
    onUpdate('selected_carriers', updated);
  };

  const handleFileUpload = async (file: File) => {
    await onUpload(file, 'corporate_resolution');
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
    setShowAllCarriers(false); // Reset expansion when filters change
  };

  // Filter carriers based on search and selected tags
  const filteredCarriers = useMemo(() => {
    let result = carriers;

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(query));
    }

    // Filter by tags (if any selected) - carrier must have at least one matching tag
    if (selectedTags.length > 0) {
      result = result.filter(c => {
        if (!c.product_tags || c.product_tags.length === 0) return false;
        return selectedTags.some(tag => c.product_tags.includes(tag));
      });
    }

    return result;
  }, [carriers, searchQuery, selectedTags]);

  // Separate recommended and other carriers
  const { recommendedCarriers, otherCarriers } = useMemo(() => {
    const recommended = filteredCarriers.filter(c => RECOMMENDED_CARRIER_CODES.includes(c.code));
    const others = filteredCarriers.filter(c => !RECOMMENDED_CARRIER_CODES.includes(c.code));
    return { recommendedCarriers: recommended, otherCarriers: others };
  }, [filteredCarriers]);

  // Check if any selected carrier requires corporate resolution
  const needsCorporateResolution = application.is_corporation && 
    selectedCarriers.some(sc => {
      const carrier = carriers.find(c => c.id === sc.carrier_id);
      return carrier?.requires_corporate_resolution;
    });

  const hasActiveFilters = searchQuery.trim() || selectedTags.length > 0;

  return (
    <div className="max-w-3xl mx-auto">
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
          <p className="text-[10px] text-muted-foreground mt-0.5 max-w-md mx-auto leading-relaxed">
            Select carriers you plan to work with now. You can request additional carriers anytime after onboarding.
          </p>
        </div>

        <CardContent className="py-4 px-5 space-y-4">
          {/* Corporation context (separated at top) */}
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg border border-border/30">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_corporation"
                checked={application.is_corporation}
                onCheckedChange={checked => onUpdate('is_corporation', !!checked)}
                className="h-3.5 w-3.5"
              />
              <Label htmlFor="is_corporation" className="text-xs font-normal cursor-pointer text-muted-foreground">
                Applying as a corporation or business entity
              </Label>
            </div>
          </div>

          {/* Guided tag selection */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground/80">What products do you plan to sell?</p>
            <div className="flex flex-wrap gap-1.5">
              {PRODUCT_TAGS.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] transition-all border ${
                    selectedTags.includes(tag.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                  title={tag.description}
                >
                  {tag.label}
                </button>
              ))}
            </div>
            {selectedTags.length === 0 && (
              <p className="text-[10px] text-muted-foreground/70">Select product types to filter, or browse all carriers below</p>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search carriers by name..."
              className="h-8 text-sm pl-8"
            />
          </div>

          {/* Carriers list */}
          {loading ? (
            <div className="text-center py-6 text-sm text-muted-foreground">Loading carriers...</div>
          ) : (
            <ScrollArea className="h-[220px]">
              <div className="space-y-3 pr-3">
                {/* Recommended carriers */}
                {recommendedCarriers.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3 w-3 text-amber-500" />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                          {hasActiveFilters ? 'Matching Recommended' : 'Recommended Carriers'}
                        </span>
                      </div>
                      {recommendedCarriers.some(c => !isCarrierSelected(c.id)) && (
                        <button
                          onClick={() => {
                            const newSelections = recommendedCarriers
                              .filter(c => !isCarrierSelected(c.id))
                              .map(c => ({
                                carrier_id: c.id,
                                carrier_name: c.name,
                                non_resident_states: [],
                              }));
                            onUpdate('selected_carriers', [...selectedCarriers, ...newSelections]);
                          }}
                          className="text-[10px] text-primary hover:underline font-medium"
                        >
                          Select all
                        </button>
                      )}
                      {recommendedCarriers.some(c => isCarrierSelected(c.id)) && (
                        <button
                          onClick={() => {
                            const recommendedIds = recommendedCarriers.map(c => c.id);
                            onUpdate('selected_carriers', selectedCarriers.filter(c => !recommendedIds.includes(c.carrier_id)));
                          }}
                          className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                        >
                          Deselect all
                        </button>
                      )}
                    </div>
                    {recommendedCarriers.map(carrier => (
                      <CarrierRow
                        key={carrier.id}
                        carrier={carrier}
                        selected={isCarrierSelected(carrier.id)}
                        selectedCarrier={selectedCarriers.find(c => c.carrier_id === carrier.id)}
                        onToggle={toggleCarrier}
                        onUpdateStates={updateCarrierStates}
                        isRecommended
                      />
                    ))}
                  </div>
                )}

                {/* Other carriers */}
                {otherCarriers.length > 0 && (
                  <div className="space-y-1.5">
                    {recommendedCarriers.length > 0 && (
                      <div className="flex items-center gap-1.5 mb-2 mt-3 pt-3 border-t border-border/30">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                          {hasActiveFilters ? 'Other Matching Carriers' : 'All Carriers'}
                        </span>
                      </div>
                    )}
                    {(showAllCarriers || otherCarriers.length <= 8 ? otherCarriers : otherCarriers.slice(0, 8)).map(carrier => (
                      <CarrierRow
                        key={carrier.id}
                        carrier={carrier}
                        selected={isCarrierSelected(carrier.id)}
                        selectedCarrier={selectedCarriers.find(c => c.carrier_id === carrier.id)}
                        onToggle={toggleCarrier}
                        onUpdateStates={updateCarrierStates}
                      />
                    ))}
                    {!showAllCarriers && otherCarriers.length > 8 && (
                      <button
                        onClick={() => setShowAllCarriers(true)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                      >
                        <ChevronDown className="h-3 w-3" />
                        Show {otherCarriers.length - 8} more carriers
                      </button>
                    )}
                    {showAllCarriers && otherCarriers.length > 8 && (
                      <button
                        onClick={() => setShowAllCarriers(false)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2"
                      >
                        <ChevronUp className="h-3 w-3" />
                        Show less
                      </button>
                    )}
                  </div>
                )}

                {filteredCarriers.length === 0 && (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    {hasActiveFilters 
                      ? 'No carriers match your search or filters.' 
                      : 'No carriers available.'}
                  </div>
                )}
              </div>
            </ScrollArea>
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

          {/* Selection summary and reassurance */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div>
              <span className="text-sm font-medium">
                {selectedCarriers.length} carrier{selectedCarriers.length !== 1 ? 's' : ''} selected
              </span>
              <p className="text-[10px] text-muted-foreground">
                You can add more carriers after completing setup
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
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

// Extracted carrier row component for cleaner code
function CarrierRow({ 
  carrier, 
  selected, 
  selectedCarrier, 
  onToggle, 
  onUpdateStates,
  isRecommended = false 
}: {
  carrier: Carrier;
  selected: boolean;
  selectedCarrier?: SelectedCarrier;
  onToggle: (carrier: Carrier, checked: boolean) => void;
  onUpdateStates: (carrierId: string, states: string[]) => void;
  isRecommended?: boolean;
}) {
  return (
    <div className={`p-2 rounded-lg border transition-all ${
      selected 
        ? 'border-primary/40 bg-primary/5' 
        : isRecommended 
          ? 'border-amber-200/50 bg-amber-50/20 dark:border-amber-900/30 dark:bg-amber-950/10 hover:bg-amber-50/40 dark:hover:bg-amber-950/20'
          : 'border-border/40 hover:bg-muted/30'
    }`}>
      <div className="flex items-center gap-3">
        <Checkbox
          id={`carrier_${carrier.id}`}
          checked={selected}
          onCheckedChange={checked => onToggle(carrier, !!checked)}
          className="h-4 w-4"
        />
        <Label 
          htmlFor={`carrier_${carrier.id}`} 
          className="flex-1 text-sm font-normal cursor-pointer flex items-center gap-2"
        >
          {carrier.name}
          {isRecommended && !selected && (
            <span className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
              Recommended
            </span>
          )}
        </Label>
        
        {selected && carrier.requires_non_resident_states && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Non-res:</span>
            <Input
              value={selectedCarrier?.non_resident_states?.join(', ') || ''}
              onChange={e => {
                const states = e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                onUpdateStates(carrier.id, states);
              }}
              placeholder="KY, TN"
              className="h-6 text-xs w-24"
            />
          </div>
        )}
      </div>
    </div>
  );
}
