import { useState, useEffect } from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { addAgentCarriers } from '@/lib/sync';
import Navigation from '@/components/Navigation';

interface NewAgentSetupProps {
  profileId: string;
  onComplete: (carrierIds: string[]) => void;
}

interface Carrier {
  id: string;
  code: string;
  name: string;
}

// Carrier brand colors for visual consistency
const CARRIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  humana: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-500' },
  aetna: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500' },
  anthem: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-500' },
  wellcare: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500' },
  uhc: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-500' },
  cigna: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-500' },
  devoted: { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-500' },
  molina: { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-500' },
  essence: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-500' },
  bcbs: { bg: 'bg-sky-100', text: 'text-sky-600', border: 'border-sky-500' },
  default: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-500' },
};

function getCarrierColors(code: string) {
  return CARRIER_COLORS[code.toLowerCase()] || CARRIER_COLORS.default;
}

export function NewAgentSetup({ profileId, onComplete }: NewAgentSetupProps) {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchContractedCarriers() {
      try {
        // Fetch carriers where agent is contracted
        const { data: contractedCarriers, error: carriersError } = await supabase
          .from('carrier_statuses')
          .select(`
            carrier_id,
            carriers (
              id,
              code,
              name
            )
          `)
          .eq('profile_id', profileId)
          .eq('contracting_status', 'contracted');

        if (carriersError) throw carriersError;

        // Map to Carrier interface
        const carrierList: Carrier[] = (contractedCarriers || [])
          .filter((cs) => cs.carriers)
          .map((cs) => {
            const carrier = cs.carriers as { id: string; code: string; name: string };
            return {
              id: carrier.id,
              code: carrier.code,
              name: carrier.name,
            };
          });

        setCarriers(carrierList);

        // Check for prior production uploads to pre-select carriers
        if (carrierList.length > 0) {
          const { data: priorUploads } = await supabase
            .from('production_uploads')
            .select('carrier_id')
            .eq('profile_id', profileId)
            .eq('status', 'complete');

          const carriersWithPriorData = new Set(priorUploads?.map((u) => u.carrier_id) || []);

          // Pre-select carriers that have prior production data
          const preSelected = carrierList
            .filter((c) => carriersWithPriorData.has(c.id))
            .map((c) => c.id);

          if (preSelected.length > 0) {
            setSelectedIds(new Set(preSelected));
          }
        }
      } catch (error) {
        console.error('Error fetching contracted carriers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchContractedCarriers();
  }, [profileId]);

  const toggleCarrier = (carrierId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(carrierId)) {
        next.delete(carrierId);
      } else {
        next.add(carrierId);
      }
      return next;
    });
  };

  const handleContinue = async () => {
    if (selectedIds.size === 0) return;

    setSaving(true);
    try {
      const carrierIds = Array.from(selectedIds);
      await addAgentCarriers(profileId, carrierIds);
      onComplete(carrierIds);
    } catch (error) {
      console.error('Failed to save carriers:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-white">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Empty state - no contracted carriers
  if (carriers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-white flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center px-4 pt-20">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 mx-auto mb-6 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              You're not contracted yet
            </h1>
            <p className="text-gray-500 mb-6">
              To track your book of business, you need to be contracted with at least one carrier.
              Contact your admin or manager to get started with contracting.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/contracting'}
              className="mr-3"
            >
              Start Contracting
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/'}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Determine grid layout based on carrier count
  const getGridClass = () => {
    if (carriers.length <= 4) return 'grid-cols-2';
    if (carriers.length <= 6) return 'grid-cols-2 sm:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  // For many carriers, use a more compact card style
  const isCompactView = carriers.length > 6;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-white flex flex-col">
      <Navigation />
      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 pt-24">
        <div className={cn('w-full text-center', carriers.length > 6 ? 'max-w-3xl' : 'max-w-lg')}>
          {/* Headline */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Let's set up your book
          </h1>
          <p className="text-gray-500 mb-8">
            Select the carriers you want to track in your book of business
          </p>

          {/* Carrier Grid */}
          <div className={cn(
            'grid gap-4 mb-8',
            getGridClass(),
            carriers.length > 8 && 'max-h-[400px] overflow-y-auto pr-2'
          )}>
            {carriers.map((carrier) => {
              const isSelected = selectedIds.has(carrier.id);
              const colors = getCarrierColors(carrier.code);

              return (
                <button
                  key={carrier.id}
                  onClick={() => toggleCarrier(carrier.id)}
                  className={cn(
                    'relative rounded-xl transition-all text-left',
                    isCompactView ? 'p-4' : 'p-6',
                    isSelected
                      ? `bg-white border-2 ${colors.border} shadow-md`
                      : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                  )}
                >
                  {/* Carrier Icon */}
                  <div
                    className={cn(
                      'rounded-xl flex items-center justify-center',
                      isCompactView ? 'w-10 h-10 mb-3' : 'w-12 h-12 mb-4',
                      colors.bg
                    )}
                  >
                    <span className={cn('font-bold', colors.text, isCompactView ? 'text-base' : 'text-lg')}>
                      {carrier.name.charAt(0)}
                    </span>
                  </div>

                  {/* Carrier Name */}
                  <p className={cn('font-medium text-gray-900', isCompactView ? 'text-sm mb-0.5' : 'mb-1')}>
                    {carrier.name}
                  </p>

                  {/* Selection State */}
                  <p className={cn(
                    'text-sm',
                    isSelected ? colors.text : 'text-gray-400'
                  )}>
                    {isSelected ? '✓ Selected' : 'Tap to add'}
                  </p>

                  {/* Checkmark */}
                  {isSelected && (
                    <div className={cn(
                      'absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center',
                      colors.bg
                    )}>
                      <Check className={cn('w-4 h-4', colors.text)} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selection count hint */}
          {selectedIds.size > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              {selectedIds.size} of {carriers.length} carrier{carriers.length !== 1 ? 's' : ''} selected
            </p>
          )}

          {/* CTA Button */}
          <Button
            onClick={handleContinue}
            disabled={selectedIds.size === 0 || saving}
            size="lg"
            className="w-full max-w-xs"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : selectedIds.size === 0 ? (
              'Select at least one carrier'
            ) : (
              `Track ${selectedIds.size} Carrier${selectedIds.size !== 1 ? 's' : ''}`
            )}
          </Button>

          {/* Hint */}
          <p className="text-xs text-gray-400 mt-4">
            You can update your tracked carriers anytime
          </p>
        </div>
      </div>
    </div>
  );
}
