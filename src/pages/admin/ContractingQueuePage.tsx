import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Search, 
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ContractingSubmissionDetail } from '@/components/admin/ContractingSubmissionDetail';

interface ContractingSubmission {
  id: string;
  user_id: string;
  full_legal_name: string | null;
  email_address: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  npn_number: string | null;
  resident_state: string | null;
  uploaded_documents: Record<string, string> | null;
  is_test?: boolean;
}

export default function ContractingQueuePage() {
  const [submissions, setSubmissions] = useState<ContractingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hideTestData, setHideTestData] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousSelectedId = useRef<string | null>(null);

  const selected = submissions.find(s => s.id === selectedId);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Handle transition animation when switching submissions
  useEffect(() => {
    if (selectedId !== previousSelectedId.current) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
      previousSelectedId.current = selectedId;
      return () => clearTimeout(timer);
    }
  }, [selectedId]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('contracting_applications')
        .select('id, user_id, full_legal_name, email_address, status, submitted_at, created_at, updated_at, npn_number, resident_state, uploaded_documents, is_test')
        .order('submitted_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setSubmissions((data || []) as ContractingSubmission[]);
      
      // Auto-select first submission
      if (data && data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      toast.error('Failed to load contracting submissions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'in_progress': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted': return 'New';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'in_progress': return 'In Progress';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="h-3 w-3" />;
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'rejected': return <X className="h-3 w-3" />;
      case 'in_progress': return <AlertCircle className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = 
      s.full_legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.npn_number?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesTestFilter = hideTestData ? !s.is_test : true;
    
    return matchesSearch && matchesStatus && matchesTestFilter;
  });

  const statusCounts = {
    all: submissions.filter(s => hideTestData ? !s.is_test : true).length,
    submitted: submissions.filter(s => s.status === 'submitted' && (hideTestData ? !s.is_test : true)).length,
    approved: submissions.filter(s => s.status === 'approved' && (hideTestData ? !s.is_test : true)).length,
    rejected: submissions.filter(s => s.status === 'rejected' && (hideTestData ? !s.is_test : true)).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Submissions List */}
        <div className="w-96 border-r border-border flex flex-col bg-card">
          {/* Header */}
          <div className="p-4 border-b border-border space-y-4">
            <h1 className="text-xl font-semibold text-foreground">Contracting Queue</h1>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or NPN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All', count: statusCounts.all },
                { value: 'submitted', label: 'New', count: statusCounts.submitted },
                { value: 'approved', label: 'Approved', count: statusCounts.approved },
                { value: 'rejected', label: 'Rejected', count: statusCounts.rejected },
              ].map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    statusFilter === tab.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Hide Test Data Toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="hideTest"
                checked={hideTestData}
                onCheckedChange={(checked) => setHideTestData(checked as boolean)}
              />
              <label htmlFor="hideTest" className="text-sm text-muted-foreground cursor-pointer">
                Hide test data
              </label>
            </div>
          </div>

          {/* Submissions List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2" />
                <p className="text-sm">No submissions found</p>
              </div>
            ) : (
              filteredSubmissions.map(submission => (
                <button
                  key={submission.id}
                  onClick={() => setSelectedId(submission.id)}
                  className={`w-full p-4 border-b border-border text-left transition-all duration-200 ${
                    selectedId === submission.id
                      ? 'bg-primary/5 border-l-4 border-l-primary'
                      : 'hover:bg-muted/50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-foreground truncate">
                      {submission.full_legal_name || 'Unknown'}
                      {submission.is_test && (
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-amber-100 text-amber-700">
                          TEST
                        </span>
                      )}
                    </span>
                    <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${getStatusStyle(submission.status)}`}>
                      {getStatusIcon(submission.status)}
                      {getStatusLabel(submission.status)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {submission.resident_state || 'N/A'} • NPN: {submission.npn_number || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {submission.submitted_at 
                      ? format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')
                      : 'Not submitted'}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Submission Details */}
        <div className="flex-1 overflow-y-auto bg-background">
          {selected ? (
            <div className={`p-6 transition-opacity duration-150 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
              <ContractingSubmissionDetail
                submission={selected}
                onRefresh={fetchSubmissions}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">Select a submission to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
