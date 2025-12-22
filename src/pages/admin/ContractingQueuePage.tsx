import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  UserX,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { toast } from "sonner";
import { ContractingSubmissionDetail } from "@/components/admin/ContractingSubmissionDetail";

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
  // From profiles join
  profile_name?: string | null;
  profile_email?: string | null;
}

interface WaitingAgent {
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  onboarding_status: string;
}

export default function ContractingQueuePage() {
  const [submissions, setSubmissions] = useState<ContractingSubmission[]>([]);
  const [waitingAgents, setWaitingAgents] = useState<WaitingAgent[]>([]);
  const [waitingCollapsed, setWaitingCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hideTestData, setHideTestData] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousSelectedId = useRef<string | null>(null);

  const selected = submissions.find((s) => s.id === selectedId);

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
      // Fetch agents waiting to complete wizard (CONTRACTING_REQUIRED status)
      const { data: waiting, error: waitingError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, created_at, onboarding_status")
        .eq("onboarding_status", "CONTRACTING_REQUIRED")
        .eq("role", "agent")
        .order("created_at", { ascending: false });

      if (waitingError) {
        console.error("Error fetching waiting agents:", waitingError);
      } else {
        setWaitingAgents(waiting || []);
      }

      // Fetch contracting applications
      const { data: applications, error: appError } = await supabase
        .from("contracting_applications")
        .select(
          "id, user_id, full_legal_name, email_address, status, submitted_at, created_at, updated_at, npn_number, resident_state, uploaded_documents, is_test",
        )
        .order("submitted_at", { ascending: false, nullsFirst: false });

      if (appError) throw appError;

      // Fetch profiles to get names for agents who haven't completed the wizard
      const userIds = (applications || []).map((a) => a.user_id).filter(Boolean);

      let profileMap: Record<string, { full_name: string | null; email: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);

        if (!profileError && profiles) {
          profileMap = profiles.reduce(
            (acc, p) => {
              acc[p.user_id] = { full_name: p.full_name, email: p.email };
              return acc;
            },
            {} as Record<string, { full_name: string | null; email: string | null }>,
          );
        }
      }

      // Merge profile data with applications
      const merged = (applications || []).map((app) => ({
        ...app,
        profile_name: profileMap[app.user_id]?.full_name || null,
        profile_email: profileMap[app.user_id]?.email || null,
      })) as ContractingSubmission[];

      setSubmissions(merged);

      // Auto-select first submission
      if (merged.length > 0 && !selectedId) {
        setSelectedId(merged[0].id);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      toast.error("Failed to load contracting submissions");
    } finally {
      setLoading(false);
    }
  };

  // Get display name - prefer full_legal_name, fall back to profile name
  const getDisplayName = (submission: ContractingSubmission): string => {
    return submission.full_legal_name || submission.profile_name || "Unknown";
  };

  // Get display email - prefer email_address, fall back to profile email
  const getDisplayEmail = (submission: ContractingSubmission): string => {
    return submission.email_address || submission.profile_email || "";
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "in_progress":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "submitted":
        return "New";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "in_progress":
        return "In Progress";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <Clock className="h-3 w-3" />;
      case "approved":
        return <CheckCircle className="h-3 w-3" />;
      case "rejected":
        return <AlertCircle className="h-3 w-3" />;
      case "in_progress":
        return <FileText className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    const displayName = getDisplayName(s).toLowerCase();
    const displayEmail = getDisplayEmail(s).toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      displayName.includes(searchLower) || displayEmail.includes(searchLower) || s.npn_number?.includes(searchTerm);

    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesTestFilter = hideTestData ? !s.is_test : true;

    return matchesSearch && matchesStatus && matchesTestFilter;
  });

  const statusCounts = {
    all: submissions.filter((s) => (hideTestData ? !s.is_test : true)).length,
    submitted: submissions.filter((s) => s.status === "submitted" && (hideTestData ? !s.is_test : true)).length,
    approved: submissions.filter((s) => s.status === "approved" && (hideTestData ? !s.is_test : true)).length,
    rejected: submissions.filter((s) => s.status === "rejected" && (hideTestData ? !s.is_test : true)).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Fixed position below nav, extends to bottom */}
      <div className="fixed top-20 left-0 right-0 bottom-0 flex">
        {/* Left Panel - Submissions List */}
        <div className="w-96 border-r border-border flex flex-col bg-card">
          {/* Header */}
          <div className="p-4 border-b border-border space-y-4 flex-shrink-0">
            <h1 className="text-xl font-semibold text-foreground">Contracting Queue</h1>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, NPN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "all", label: "All", count: statusCounts.all },
                { value: "submitted", label: "New", count: statusCounts.submitted },
                { value: "approved", label: "Approved", count: statusCounts.approved },
                { value: "rejected", label: "Rejected", count: statusCounts.rejected },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    statusFilter === tab.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
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

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            {/* Waiting on Agent Section */}
            {waitingAgents.length > 0 && (
              <div className="border-b border-border">
                <button
                  onClick={() => setWaitingCollapsed(!waitingCollapsed)}
                  className="w-full p-3 flex items-center justify-between bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {waitingCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-amber-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-amber-600" />
                    )}
                    <UserX className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Waiting on Agent</span>
                  </div>
                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                    {waitingAgents.length}
                  </span>
                </button>

                {!waitingCollapsed && (
                  <div className="bg-amber-50/50">
                    {waitingAgents.map((agent) => (
                      <div key={agent.user_id} className="p-3 border-b border-amber-100 last:border-b-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-foreground text-sm">
                            {agent.full_name || "Unnamed Agent"}
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">PENDING</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{agent.email || "No email"}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Created {format(new Date(agent.created_at), "MMM d, yyyy")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submissions List */}
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
              filteredSubmissions.map((submission) => (
                <button
                  key={submission.id}
                  onClick={() => setSelectedId(submission.id)}
                  className={`w-full p-4 border-b border-border text-left transition-all duration-200 ${
                    selectedId === submission.id
                      ? "bg-primary/5 border-l-4 border-l-primary"
                      : "hover:bg-muted/50 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground truncate">
                      {getDisplayName(submission)}
                      {submission.is_test && (
                        <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">TEST</span>
                      )}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusStyle(submission.status)}`}
                    >
                      {getStatusIcon(submission.status)}
                      {getStatusLabel(submission.status)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {submission.resident_state || "N/A"} • NPN: {submission.npn_number || "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {submission.submitted_at
                      ? format(new Date(submission.submitted_at), "MMM d, yyyy h:mm a")
                      : "Not submitted"}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Submission Details */}
        <div className="flex-1 overflow-y-auto bg-muted/30">
          {selected ? (
            <div className={`h-full transition-opacity duration-150 ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
              <ContractingSubmissionDetail submission={selected as any} onRefresh={fetchSubmissions} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a submission to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
