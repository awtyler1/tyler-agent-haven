import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { fireConfetti } from '@/lib/confetti';

interface SuccessModalProps {
  isOpen: boolean;
  agentName: string;
  onClose: () => void;
}

export function SuccessModal({ isOpen, agentName, onClose }: SuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      fireConfetti();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-4 text-center animate-in zoom-in-95 fade-in duration-300">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">
          You're All Set!
        </h2>
        
        {/* Message */}
        <p className="text-slate-600 mb-2">
          Thanks, {agentName?.split(' ')[0] || 'Agent'}! Your contracting application has been submitted.
        </p>
        
        <p className="text-sm text-slate-500 mb-8">
          Our team will review your application and get you contracted with carriers within 1-2 business days.
        </p>
        
        {/* What's Next */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">What's Next</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium shrink-0">1</span>
              <span>We'll review your documents</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium shrink-0">2</span>
              <span>Submit your applications to carriers</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium shrink-0">3</span>
              <span>You'll receive confirmation once approved</span>
            </li>
          </ul>
        </div>
        
        {/* CTA */}
        <Button 
          onClick={onClose}
          className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium"
        >
          <span>Go to Dashboard</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

