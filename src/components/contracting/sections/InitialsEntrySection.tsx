import { useState, useEffect } from 'react';
import { Check, Lock, FileText, Shield, Clock, PenLine, AlertCircle } from 'lucide-react';
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
        <div className="p-8">
          <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200/50">
            <div className="w-12 h-12 rounded-xl bg-white border border-emerald-200/50 flex items-center justify-center overflow-hidden p-1">
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
                  <Check className="h-5 w-5 text-emerald-600" />
                )}
                <p className="text-sm font-medium text-emerald-800">
                  Initials Confirmed
                </p>
              </div>
              <p className="text-xs text-emerald-700/70">
                Your initials will be used throughout this document
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-slate-50">
              <FileText className="h-5 w-5 mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">Single scrollable form</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-50">
              <Shield className="h-5 w-5 mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">Auto-saved securely</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-50">
              <Clock className="h-5 w-5 mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-500">~15 minutes to complete</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="p-8">
        {/* Important Notice */}
        <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">First Step: Draw Your Initials</p>
              <p className="text-xs text-amber-700/70 mt-1">
                Your hand-drawn initials will be used to acknowledge each section of this contracting form, 
                similar to initialing a paper document.
              </p>
            </div>
          </div>
        </div>

        {/* Initials Drawing Pad */}
        <div className="max-w-md mx-auto">
          <InitialsPad
            value={localInitialsImage || undefined}
            onChange={handleInitialsDrawn}
          />
          
          {/* Confirm Button */}
          <div className="mt-6">
            <button
              onClick={handleConfirmInitials}
              disabled={!localInitialsImage}
              className="w-full h-12 px-6 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-medium text-center mb-4 text-slate-700">What you'll need</h3>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-slate-500">Insurance License</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-slate-500">E&O Certificate</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-slate-500">Voided Check</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-slate-500">AML Certificate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
