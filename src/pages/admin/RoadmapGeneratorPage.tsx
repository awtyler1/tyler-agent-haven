// src/pages/admin/RoadmapGeneratorPage.tsx
// V5 - Roadmap Generator with goal-driven profiles

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoadmapGenerator } from '@/hooks/useRoadmapGenerator';
import { BrokerProfileForm } from '@/components/roadmap/BrokerProfileForm';
import { BrokerProfile } from '@/types/roadmap';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  Plus,
  FileText,
  Download,
  ArrowLeft,
  Calendar,
  Users,
  Target,
  Loader2,
  Pencil,
  Trash2,
  MoreVertical,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow, format } from 'date-fns';

type ViewMode = 'list' | 'new' | 'edit';

export default function RoadmapGeneratorPage() {
  const { profile } = useAuth();
  const {
    generating,
    saving,
    loading,
    generateRoadmap,
    saveBrokerProfile,
    fetchBrokerRoadmaps,
    deleteBrokerProfile,
    updateProfileAfterGeneration,
    downloadPdf,
  } = useRoadmapGenerator();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [brokerProfiles, setBrokerProfiles] = useState<BrokerProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<BrokerProfile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Get manager name for form
  const managerName = profile?.full_name || 'TIG Leadership';
  const managerId = profile?.id;

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const profiles = await fetchBrokerRoadmaps();
    setBrokerProfiles(profiles);
  };

  // Handle form submission (save only)
  const handleSubmit = async (formData: BrokerProfile) => {
    const savedId = await saveBrokerProfile(formData);
    if (savedId) {
      await loadProfiles();
      setViewMode('list');
      setEditingProfile(null);
    }
  };

  // Handle generate (save + generate PDF + download)
  const handleGenerate = async (formData: BrokerProfile) => {
    // First save the profile
    const savedId = await saveBrokerProfile(formData);
    if (!savedId) return;

    // Update formData with saved ID
    const profileWithId = { ...formData, id: savedId };

    // Generate the roadmap
    const result = await generateRoadmap(profileWithId);

    if (result.success && result.pdf && result.filename) {
      // Update the profile with generated data
      await updateProfileAfterGeneration(savedId, result);

      // Download the PDF
      downloadPdf(result.pdf, result.filename);

      // Refresh the list and go back
      await loadProfiles();
      setViewMode('list');
      setEditingProfile(null);
    }
  };

  // Handle regenerate from list
  const handleRegenerate = async (brokerProfile: BrokerProfile) => {
    if (!brokerProfile.id) return;

    setGeneratingId(brokerProfile.id);

    const result = await generateRoadmap(brokerProfile);

    if (result.success && result.pdf && result.filename) {
      await updateProfileAfterGeneration(brokerProfile.id, result);
      downloadPdf(result.pdf, result.filename);
      await loadProfiles();
    }

    setGeneratingId(null);
  };

  // Handle edit
  const handleEdit = (brokerProfile: BrokerProfile) => {
    setEditingProfile(brokerProfile);
    setViewMode('edit');
  };

  // Handle delete
  const handleDeleteClick = (id: string) => {
    setProfileToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (profileToDelete) {
      const success = await deleteBrokerProfile(profileToDelete);
      if (success) {
        await loadProfiles();
      }
    }
    setDeleteDialogOpen(false);
    setProfileToDelete(null);
  };

  // Render list view
  const renderListView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roadmap Generator</h1>
          <p className="text-slate-500">Create strategic growth roadmaps for agents</p>
        </div>
        <Button
          onClick={() => {
            setEditingProfile(null);
            setViewMode('new');
          }}
          className="bg-gold hover:bg-gold/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Roadmap
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      )}

      {/* Empty state */}
      {!loading && brokerProfiles.length === 0 && (
        <div className="bg-white rounded-xl border border-[#E5E2DB] p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No roadmaps yet</h3>
          <p className="text-slate-500 mb-6">Create your first agent roadmap to get started</p>
          <Button
            onClick={() => setViewMode('new')}
            className="bg-gold hover:bg-gold/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Roadmap
          </Button>
        </div>
      )}

      {/* Profile cards */}
      {!loading && brokerProfiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brokerProfiles.map((bp) => (
            <div
              key={bp.id}
              className="bg-white rounded-xl border border-[#E5E2DB] p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{bp.broker_name}</h3>
                  <p className="text-sm text-slate-500">{bp.manager_name}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(bp)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRegenerate(bp)}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(bp.id!)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <Target className="w-4 h-4 text-gold mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Goal</p>
                  <p className="font-semibold">{bp.monthly_goal}/mo</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <Users className="w-4 h-4 text-gold mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Book</p>
                  <p className="font-semibold">{bp.book_size}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <Sparkles className="w-4 h-4 text-gold mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Lead Star</p>
                  <p className="font-semibold">{bp.lead_star_leads || 0}</p>
                </div>
              </div>

              {/* Resources badges */}
              <div className="flex flex-wrap gap-1 mb-4">
                {bp.lead_star_leads > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Lead Star: {bp.lead_star_leads}/mo
                  </span>
                )}
                {bp.seminar_eligible && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    Seminars {bp.seminars_planned && bp.seminars_planned > 0 ? `(${bp.seminars_planned} planned)` : '(eligible)'}
                  </span>
                )}
                {bp.mira_access && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    MIRA Access
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                {bp.last_generated_at ? (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Generated {formatDistanceToNow(new Date(bp.last_generated_at), { addSuffix: true })}
                  </span>
                ) : (
                  <span className="text-amber-600">Not generated yet</span>
                )}
                {bp.review_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Review: {format(new Date(bp.review_date), 'MMM d')}
                  </span>
                )}
              </div>

              {/* Generate button if generating */}
              {generatingId === bp.id && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-center gap-2 text-sm text-gold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating PDF...
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render form view (new or edit)
  const renderFormView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => {
            setViewMode('list');
            setEditingProfile(null);
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {viewMode === 'edit' ? 'Edit Roadmap' : 'New Roadmap'}
          </h1>
          <p className="text-slate-500">
            {viewMode === 'edit'
              ? `Editing roadmap for ${editingProfile?.broker_name}`
              : 'Create a strategic growth roadmap for an agent'}
          </p>
        </div>
      </div>

      {/* Form */}
      <BrokerProfileForm
        initialData={editingProfile || undefined}
        managerName={managerName}
        managerId={managerId}
        onSubmit={handleSubmit}
        onGenerate={handleGenerate}
        isSubmitting={saving}
        isGenerating={generating}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F7]">
      <Navigation />

      <main className="flex-1 pt-28 pb-12">
        <div className="container-narrow px-6 md:px-12 lg:px-20 max-w-5xl mx-auto">
        {viewMode === 'list' && renderListView()}
        {(viewMode === 'new' || viewMode === 'edit') && renderFormView()}
        </div>
      </main>

      <Footer />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Roadmap?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this broker's roadmap profile. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
