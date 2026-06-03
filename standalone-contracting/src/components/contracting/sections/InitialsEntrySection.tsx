import { useState, useEffect } from 'react';
import { Check, Lock, PenLine, AlertCircle } from 'lucide-react';
import { InitialsPad } from '../InitialsPad';

interface InitialsEntrySectionProps {
  fullName: string | null;
  initials: string | null;
  initialsImage?: string | null;
  onInitialsChange: (initials: string) => void;
  onInitialsImageChange: (image: string | null) => void;
  isLocked: boolean;
}

export function InitialsEntrySection({ 
  fullName, 
  initials,
  initialsImage,
  onInitialsChange,
  onInitialsImageChange,
  isLocked 
}: InitialsEntrySectionProps) {
  const [isConfirmed, setIsConfirmed] = useState(!!initialsImage);
  const [localInitialsImage, setLocalInitialsImage] = useState<string | null>(initialsImage || null);

  // Check if initials are already confirmed (from saved state)
  useEffect(() => {
    if (initialsImage) {
      setIsConfirmed(true);
      setLocalInitialsImage(initialsImage);
    }
  }, [initialsImage]);

  const handleConfirmInitials = () => {
    if (localInitialsImage) {
      // Generate a placeholder text representation for the initials
      const initialsText = fullName 
        ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3)
        : 'INI';
      onInitialsChange(initialsText);
      onInitialsImageChange(localInitialsImage);
      setIsConfirmed(true);
    }
  };

  const handleInitialsDrawn = (image: string | null) => {
    setLocalInitialsImage(image);
  };

  if (isConfirmed && initialsImage) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200/50">
            <div className="w-10 h-10 rounded-lg bg-white border border-emerald-200/50 flex items-center justify-center overflow-hidden p-1">
              <img
                src={initialsImage}
                alt="Your initials"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                {isLocked ? (
                  <Lock className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Check className="h-4 w-4 text-emerald-600" />
                )}
                <p className="text-sm font-medium text-emerald-800">
                  Initials Confirmed
                </p>
              </div>
              <p className="text-xs text-emerald-700/70">
                Click Continue to begin your application
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="p-5">
        {/* Important Notice */}
        <div className="max-w-lg mx-auto mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200/50">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">First Step: Draw Your Initials</p>
              <p className="text-xs text-amber-700/70">
                Your initials will be used to acknowledge each section.
              </p>
            </div>
          </div>
        </div>

        {/* Initials Drawing Pad */}
        <div className="max-w-lg mx-auto">
          <InitialsPad
            value={localInitialsImage || undefined}
            onChange={handleInitialsDrawn}
          />

          {/* Confirm Button */}
          <div className="mt-4">
            <button
              onClick={handleConfirmInitials}
              disabled={!localInitialsImage}
              className="w-full h-11 px-6 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {localInitialsImage ? (
                <>
                  <Check className="h-4 w-4" />
                  Confirm Initials & Begin Form
                </>
              ) : (
                <>
                  <PenLine className="h-4 w-4" />
                  Draw Your Initials Above
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200">
          <h3 className="text-sm font-medium text-center mb-2 text-slate-700">What you'll need</h3>
          <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto">
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-xs text-slate-500">Insurance License</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-xs text-slate-500">E&O Certificate</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-xs text-slate-500">Voided Check</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-xs text-slate-400">Non-resident</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
