import { useEffect, useRef, useState, useCallback } from 'react';
import usePlacesAutocomplete, { getGeocode, getDetails } from 'use-places-autocomplete';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MapPin, Loader2 } from 'lucide-react';

// Type for parsed address components
export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onBlur?: () => void;
}

// Load Google Maps script
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// Debug: log if API key is present
console.log('[AddressAutocomplete] API Key present:', !!GOOGLE_MAPS_API_KEY);

let isScriptLoading = false;
let isScriptLoaded = false;
const scriptLoadCallbacks: (() => void)[] = [];

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (isScriptLoaded && window.google?.maps?.places) {
      resolve();
      return;
    }

    // Script is currently loading, queue the callback
    if (isScriptLoading) {
      scriptLoadCallbacks.push(() => resolve());
      return;
    }

    // No API key
    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error('Google Places API key not configured'));
      return;
    }

    // Start loading
    isScriptLoading = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      resolve();
      // Resolve all queued callbacks
      scriptLoadCallbacks.forEach(cb => cb());
      scriptLoadCallbacks.length = 0;
    };

    script.onerror = () => {
      isScriptLoading = false;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });
}

// Parse Google Place result into address components
function parseAddressComponents(place: google.maps.places.PlaceResult): ParsedAddress {
  const components = place.address_components || [];

  const getComponent = (types: string[]): string => {
    const component = components.find(c =>
      types.some(type => c.types.includes(type))
    );
    return component?.long_name || '';
  };

  const getShortComponent = (types: string[]): string => {
    const component = components.find(c =>
      types.some(type => c.types.includes(type))
    );
    return component?.short_name || '';
  };

  // Build street address from street number and route
  const streetNumber = getComponent(['street_number']);
  const route = getComponent(['route']);
  const street = streetNumber && route ? `${streetNumber} ${route}` : route || streetNumber;

  return {
    street,
    city: getComponent(['locality', 'sublocality', 'neighborhood']),
    state: getShortComponent(['administrative_area_level_1']),
    zip: getComponent(['postal_code']),
    county: getComponent(['administrative_area_level_2']).replace(' County', ''),
  };
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing an address...",
  className,
  disabled,
  onBlur,
}: AddressAutocompleteProps) {
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load Google Maps script on mount
  useEffect(() => {
    console.log('[AddressAutocomplete] Loading script...');
    loadGoogleMapsScript()
      .then(() => {
        console.log('[AddressAutocomplete] Script loaded successfully');
        setIsReady(true);
      })
      .catch((err) => {
        console.error('[AddressAutocomplete] Script load error:', err);
        setLoadError(true);
      });
  }, []);

  const {
    ready,
    value: autocompleteValue,
    suggestions: { status, data },
    setValue: setAutocompleteValue,
    clearSuggestions,
    init,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'us' },
      types: ['address'],
    },
    debounce: 300,
    initOnMount: false,
  });

  // Initialize autocomplete when script is ready
  useEffect(() => {
    console.log('[AddressAutocomplete] Init check - isReady:', isReady, 'google.maps.places:', !!window.google?.maps?.places, 'hook ready:', ready);
    if (isReady && window.google?.maps?.places && !ready) {
      console.log('[AddressAutocomplete] Calling init()');
      init();
    }
  }, [isReady, ready, init]);

  // Sync external value changes
  useEffect(() => {
    if (!isSelecting) {
      setAutocompleteValue(value, false);
    }
  }, [value, setAutocompleteValue, isSelecting]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setAutocompleteValue(newValue);
    onChange(newValue);
  };

  const handleSelect = useCallback(async (placeId: string, description: string) => {
    setIsSelecting(true);
    clearSuggestions();

    try {
      // Get detailed place information
      const results = await getGeocode({ placeId });
      if (results && results[0]) {
        const parsed = parseAddressComponents(results[0]);

        // Update the input with the street address
        setAutocompleteValue(parsed.street, false);
        onChange(parsed.street);

        // Notify parent of full address
        onAddressSelect(parsed);
      }
    } catch (error) {
      console.error('Error fetching address details:', error);
      // Fallback: just use the description
      setAutocompleteValue(description, false);
      onChange(description);
    } finally {
      setIsSelecting(false);
    }
  }, [clearSuggestions, setAutocompleteValue, onChange, onAddressSelect]);

  // If API key missing or load failed, render simple input
  if (!GOOGLE_MAPS_API_KEY || loadError) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
    );
  }

  // Show loading state while script loads
  if (!isReady) {
    return (
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
        />
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={autocompleteValue}
        onChange={handleInput}
        onBlur={() => {
          // Delay to allow click on suggestions
          setTimeout(() => {
            clearSuggestions();
            onBlur?.();
          }, 200);
        }}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />

      {/* Suggestions dropdown */}
      {ready && status === 'OK' && data.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {data.map((suggestion) => {
            const {
              place_id,
              structured_formatting: { main_text, secondary_text },
            } = suggestion;

            return (
              <li
                key={place_id}
                onClick={() => handleSelect(place_id, suggestion.description)}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
              >
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {main_text}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {secondary_text}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
