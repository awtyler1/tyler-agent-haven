import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ContractingApplication, Carrier, SelectedCarrier, PRODUCT_TAGS } from '@/types/contracting';
import { FileDropZone } from '../FileDropZone';
import { Building, Lock, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarrierSelectionSectionProps {
  application: ContractingApplication;
  carriers: Carrier[];
  onUpdate: <K extends keyof ContractingApplication>(field: K, value: ContractingApplication[K]) => void;
  onUpload: (file: File, documentType: string) => Promise<string | null>;
  disabled?: boolean;
}

export function CarrierSelectionSection({ application, carriers, onUpdate, onUpload, disabled }: CarrierSelectionSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const selectedCarriers = application.selected_carriers || [];
  const uploadedDocs = application.uploaded_documents || {};

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

  const toggleCarrier = (carrier: Carrier) => {
    if (isSelected(carrier.id)) {
      onUpdate('selected_carriers', selectedCarriers.filter(c => c.carrier_id !== carrier.id));
    } else {
      const newSelection: SelectedCarrier = {
        carrier_id: carrier.id,
        carrier_name: carrier.name,
        non_resident_states: [],
      };
      onUpdate('selected_carriers', [...selectedCarriers, newSelection]);
    }
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
              Select only the carriers you plan to work with now. You can request additional carriers later.
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
          <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
            {filteredCarriers.map((carrier) => (
              <label
                key={carrier.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                  isSelected(carrier.id)
                    ? "bg-primary/5 border-primary/20"
                    : "bg-muted/10 border-border/10 hover:bg-muted/20"
                )}
              >
                <Checkbox
                  checked={isSelected(carrier.id)}
                  onCheckedChange={() => toggleCarrier(carrier)}
                />
                <div className="flex-1 min-w-0">
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
                {isSelected(carrier.id) && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </label>
            ))}
          </div>

          {/* Corporate Resolution */}
          {needsCorporateResolution && (
            <div className="pt-4 border-t border-border/10">
              <FileDropZone
                label="Corporate Resolution"
                documentType="corporate_resolution"
                existingFile={uploadedDocs['corporate_resolution']}
                onUpload={onUpload}
                onRemove={() => {}}
                required
                description="Required for Athene when applying as a corporation"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
