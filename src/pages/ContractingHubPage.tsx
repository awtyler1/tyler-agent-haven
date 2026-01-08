import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle2,
  FileText,
  Building2,
  ArrowRight,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import tylerLogo from '@/assets/tyler-logo.png';

interface ContractingApplication {
  id: string;
  status: string;
  submitted_at: string | null;
  full_legal_name: string | null;
  uploaded_documents: Record<string, string> | null;
}

const ContractingHubPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ContractingApplication | null>(null);

  useEffect(() => {
    const fetchApplication = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('contracting_applications')
        .select('id, status, submitted_at, full_legal_name, uploaded_documents')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        // No application found, redirect to contracting form
        navigate('/contracting');
        return;
      }

      setApplication(data as ContractingApplication);
      setLoading(false);
    };

    fetchApplication();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!application) {
    return null;
  }

  const statusConfig = {
    in_progress: {
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      label: 'In Progress',
      description: 'Your application is not yet complete.',
    },
    submitted: {
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      label: 'Under Review',
      description: 'Your application has been submitted and is being reviewed by our team.',
    },
    approved: {
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      label: 'Approved',
      description: 'Congratulations! Your contracting has been approved.',
    },
  };

  const status = statusConfig[application.status as keyof typeof statusConfig] || statusConfig.in_progress;
  const StatusIcon = status.icon;

  const uploadedDocs = application.uploaded_documents || {};
  const documentLabels: Record<string, string> = {
    resident_license: 'Resident License',
    eo_certificate: 'E&O Certificate',
    voided_check: 'Voided Check',
    drivers_license: "Driver's License",
    contracting_packet: 'Contracting Packet (PDF)',
  };

  const submittedDocuments = Object.entries(uploadedDocs)
    .filter(([key, value]) => value && !key.includes('image') && !key.includes('signature'))
    .map(([key, value]) => ({
      key,
      label: documentLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      path: value,
    }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <img src={tylerLogo} alt="Tyler Insurance" className="h-6 opacity-80" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-slate-600"
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Contracting Hub</h1>
          <p className="text-slate-500 mt-1">Track your contracting status and documents</p>
        </div>

        {/* Status Card */}
        <Card className={cn("p-6 mb-6 border-2", status.border, status.bg)}>
          <div className="flex items-start gap-4">
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", status.bg)}>
              <StatusIcon className={cn("h-6 w-6", status.color)} />
            </div>
            <div className="flex-1">
              <h2 className={cn("text-lg font-semibold", status.color)}>{status.label}</h2>
              <p className="text-slate-600 mt-1">{status.description}</p>
              {application.submitted_at && (
                <p className="text-sm text-slate-500 mt-2">
                  Submitted on {new Date(application.submitted_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
            {application.status === 'in_progress' && (
              <Button onClick={() => navigate('/contracting')} className="shrink-0">
                Continue Application
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>

        {/* Documents Section */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Submitted Documents</h3>
              <p className="text-sm text-slate-500">{submittedDocuments.length} documents on file</p>
            </div>
          </div>

          {submittedDocuments.length > 0 ? (
            <div className="space-y-2">
              {submittedDocuments.map((doc) => (
                <div
                  key={doc.key}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{doc.label}</span>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No documents uploaded yet</p>
          )}
        </Card>

        {/* Carrier Status Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Carrier Contracting</h3>
              <p className="text-sm text-slate-500">Status of your carrier appointments</p>
            </div>
          </div>

          {application.status === 'submitted' ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Carrier appointments are being processed</p>
              <p className="text-sm text-slate-400 mt-1">You'll be notified once carriers approve your application</p>
            </div>
          ) : application.status === 'approved' ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
              <p className="text-slate-700 font-medium">All carrier appointments approved!</p>
              <p className="text-sm text-slate-500 mt-1">You're ready to start selling</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Complete your application to begin carrier contracting</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default ContractingHubPage;
