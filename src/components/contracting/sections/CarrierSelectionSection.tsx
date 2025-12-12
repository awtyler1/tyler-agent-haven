import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContractingApplication, Carrier, SelectedCarrier, PRODUCT_TAGS, US_STATES } from '@/types/contracting';
import { FileDropZone } from '../FileDropZone';
import { Building, Lock, Search, Check, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FormFieldError } from '../FormFieldError';

interface CarrierSelectionSectionProps {
  application: ContractingApplication;
  carriers: Carrier[];
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, documentType: string) => Promise<string | null>;
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  showValidation?: boolean;
  onClearError?: (field: string) => void;
}

export function CarrierSelectionSection({ application, carriers, onUpdate, onUpload, disabled, fieldErrors = {}, showValidation = false, onClearError }: CarrierSelectionSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedCarriers, setExpandedCarriers] = useState<Set<string>>(new Set());
  const selectedCarriers = application.selected_carriers || [];
  const uploadedDocs = application.uploaded_documents || {};

  // Get resident state from application
  const residentState = application.resident_state || '';

  const filteredCarriers = useMemo(() => {
    return carriers.filter(carrier => {
      const matchesSearch = carrier.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => carrier.product_tags?.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [carriers, searchTerm, selectedTags]);

  const isSelected = (carrierId: string) => {
    return selectedCarriers.some(c => c.carrier_id === carrierId);
  };

  const getSelectedCarrier = (carrierId: string) => {
    return selectedCarriers.find(c => c.carrier_id === carrierId);
  };

  const toggleCarrier = (carrier: Carrier) => {
    if (isSelected(carrier.id)) {
      onUpdate('selected_carriers', selectedCarriers.filter(c => c.carrier_id !== carrier.id));
      setExpandedCarriers(prev => {
        const next = new Set(prev);
        next.delete(carrier.id);
        return next;
      });
    } else {
      const newSelection: SelectedCarrier = {
        carrier_id: carrier.id,
        carrier_name: carrier.name,
        non_resident_states: [],
      };
      onUpdate('selected_carriers', [...selectedCarriers, newSelection]);
      // Clear the error when a carrier is selected
      if (onClearError) onClearError('selected_carriers');
    }
  };

  const toggleExpanded = (carrierId: string) => {
    setExpandedCarriers(prev => {
      const next = new Set(prev);
      if (next.has(carrierId)) {
        next.delete(carrierId);
      } else {
        next.add(carrierId);
      }
      return next;
    });
  };

  const toggleNonResidentState = (carrierId: string, stateCode: string) => {
    const updatedCarriers = selectedCarriers.map(c => {
      if (c.carrier_id === carrierId) {
        const states = c.non_resident_states || [];
        if (states.includes(stateCode)) {
          return { ...c, non_resident_states: states.filter(s => s !== stateCode) };
        } else {
          return { ...c, non_resident_states: [...states, stateCode] };
        }
      }
      return c;
    });
    onUpdate('selected_carriers', updatedCarriers);
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  // Check if Athene is selected and user is a corporation
  const needsCorporateResolution = application.is_corporation && 
    selectedCarriers.some(c => c.carrier_name.toLowerCase().includes('athene'));

  // Filter out resident state from non-resident state options
  const nonResidentStateOptions = US_STATES.filter(s => s.code !== residentState);

  return (
    <Card 
      className="rounded-[28px] border-0 overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FEFEFE 100%)',
        boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.8) inset, 0px 20px 60px rgba(0, 0, 0, 0.06)'
      }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-medium">Carrier Selection</CardTitle>
            <p className="text-xs text-muted-foreground/60">Select carriers you'd like to be appointed with</p>
          </div>
          {selectedCarriers.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedCarriers.length} selected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        {disabled && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-muted-foreground/60">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Enter your initials above to unlock this section</span>
          </div>
        )}

        <div style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }} className="space-y-4">
          {/* Info banner */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-xs text-muted-foreground/70">
              Select carriers you plan to work with. By default, you'll be contracted in your resident state ({residentState || 'not set'}). 
              Click a selected carrier to add non-resident states.
            </p>
          </div>

          {/* Product type filters */}
          <div>
            <Label className="text-xs mb-2 block">Filter by product type</Label>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    selectedTags.includes(tag.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search carriers..."
              className="pl-10 h-11 rounded-xl"
            />
          </div>

          {/* Carrier list */}
          <div className={cn(
            "space-y-2 max-h-[400px] overflow-y-auto pr-2",
            showValidation && fieldErrors.selected_carriers && selectedCarriers.length === 0 && "ring-2 ring-destructive/30 rounded-xl p-2"
          )}>
            {filteredCarriers.map((carrier) => {
              const selected = isSelected(carrier.id);
              const selectedCarrier = getSelectedCarrier(carrier.id);
              const isExpanded = expandedCarriers.has(carrier.id);
              const hasNonResStates = (selectedCarrier?.non_resident_states?.length || 0) > 0;

              return (
                <div key={carrier.id} className="space-y-0">
                  <div
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                      selected
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/10 border-border/10 hover:bg-muted/20",
                      isExpanded && "rounded-b-none"
                    )}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleCarrier(carrier)}
                    />
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => toggleCarrier(carrier)}
                    >
                      <p className="text-sm font-medium truncate">{carrier.name}</p>
                      {carrier.product_tags && carrier.product_tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {carrier.product_tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] text-muted-foreground/50 bg-muted/30 px-1.5 py-0.5 rounded">
                              {PRODUCT_TAGS.find(t => t.id === tag)?.label || tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {selected && (
                      <div className="flex items-center gap-2">
                        {hasNonResStates && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <MapPin className="h-3 w-3" />
                            {selectedCarrier?.non_resident_states?.length} states
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(carrier.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      </div>
                    )}
                  </div>

                  {/* Non-resident states selector */}
                  {selected && isExpanded && (
                    <div className="p-4 bg-muted/20 rounded-b-xl border border-t-0 border-primary/20">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <Label className="text-xs font-medium">Non-Resident States for {carrier.name}</Label>
                        </div>
                        <p className="text-xs text-muted-foreground/70">
                          Select additional states you want to contract with this carrier. Your resident state ({residentState || 'not set'}) is included by default.
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                          {nonResidentStateOptions.map((state) => {
                            const isStateSelected = selectedCarrier?.non_resident_states?.includes(state.code);
                            return (
                              <button
                                key={state.code}
                                type="button"
                                onClick={() => toggleNonResidentState(carrier.id, state.code)}
                                className={cn(
                                  "px-2 py-1.5 rounded text-xs font-medium transition-colors",
                                  isStateSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background border border-border/20 text-muted-foreground hover:bg-muted/30"
                                )}
                                title={state.name}
                              >
                                {state.code}
                              </button>
                            );
                          })}
                        </div>
                        {(selectedCarrier?.non_resident_states?.length || 0) > 0 && (
                          <div className="pt-2 border-t border-border/10">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Selected:</span>{' '}
                              {selectedCarrier?.non_resident_states?.map(code => 
                                US_STATES.find(s => s.code === code)?.name || code
                              ).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <FormFieldError error={fieldErrors.selected_carriers} show={showValidation} />

          {/* Corporate Resolution */}
          {needsCorporateResolution && (
            <div className="pt-4 border-t border-border/10">
              <FileDropZone
                label="Corporate Resolution"
                documentType="corporate_resolution"
                existingFile={uploadedDocs['corporate_resolution']}
                onUpload={onUpload}
                onRemove={() => {}}
                onClearError={onClearError}
                required
                description="Required for Athene when applying as a corporation"
                hasError={showValidation && !!fieldErrors.corporate_resolution}
              />
              <FormFieldError error={fieldErrors.corporate_resolution} show={showValidation} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
