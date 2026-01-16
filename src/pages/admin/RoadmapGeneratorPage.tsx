// src/pages/admin/RoadmapGeneratorPage.tsx

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
  Sparkles
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
import { formatDistanceToNow } from 'date-fns';

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
    fetchBrokerProfile,
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

  const managerName = profile?.full_name || 'Manager';
  const managerId = profile?.id;

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const profiles = await fetchBrokerRoadmaps();
    setBrokerProfiles(profiles);
  };

  const handleCreateNew = () => {
    setEditingProfile(null);
    setViewMode('new');
  };

  const handleEdit = async (id: string) => {
    const profile = await fetchBrokerProfile(id);
    if (profile) {
      setEditingProfile(profile);
      setViewMode('edit');
    }
  };

  const handleBack = () => {
    setViewMode('list');
    setEditingProfile(null);
    loadProfiles();
  };

  const handleSave = async (profileData: BrokerProfile) => {
    const result = await saveBrokerProfile(profileData);
    if (result.success) {
      handleBack();
    }
  };

  const handleGenerate = async (profileData: BrokerProfile) => {
    // Save first if new
    let profileId = profileData.id;
    if (!profileId) {
      const saveResult = await saveBrokerProfile(profileData);
      if (!saveResult.success || !saveResult.id) return;
      profileId = saveResult.id;
      profileData.id = profileId;
    }

    const result = await generateRoadmap(profileData, true);
    if (result.success && result.pdf && result.filename) {
      // Download the PDF
      downloadPdf(result.pdf, result.filename);

      // Update the profile with generation data
      if (profileId && result.phase && result.channels) {
        await updateProfileAfterGeneration(
          profileId,
          result.filename,
          result.review_date || '',
          result.phase.name,
          result.channels
        );
      }

      handleBack();
    }
  };

  const handleGenerateFromList = async (brokerProfile: BrokerProfile) => {
    if (!brokerProfile.id) return;
    setGeneratingId(brokerProfile.id);

    const result = await generateRoadmap(brokerProfile, true);
    if (result.success && result.pdf && result.filename) {
      downloadPdf(result.pdf, result.filename);

      if (result.phase && result.channels) {
        await updateProfileAfterGeneration(
          brokerProfile.id,
          result.filename,
          result.review_date || '',
          result.phase.name,
          result.channels
        );
      }

      loadProfiles();
    }
    setGeneratingId(null);
  };

  const handleDeleteConfirm = async () => {
    if (profileToDelete) {
      await deleteBrokerProfile(profileToDelete);
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
      loadProfiles();
    }
  };

  const getPhaseColor = (months: number) => {
    if (months < 6) return 'bg-blue-100 text-blue-700';
    if (months < 18) return 'bg-amber-100 text-amber-700';
    return 'bg-green-100 text-green-700';
  };

  const getPhaseName = (months: number) => {
    if (months < 6) return 'Foundation';
    if (months < 18) return 'Growth';
    return 'Expansion';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />

      <main className="flex-1 pt-28 pb-12">
        <div className="container-narrow px-6 md:px-12 lg:px-20 max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            {viewMode !== 'list' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to list
              </button>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-serif font-semibold text-foreground mb-1">
                  {viewMode === 'list' && 'Strategic Roadmaps'}
                  {viewMode === 'new' && 'Create Roadmap'}
                  {viewMode === 'edit' && 'Edit Broker Profile'}
                </h1>
                <p className="text-muted-foreground">
                  {viewMode === 'list' && 'Generate personalized growth roadmaps for your brokers'}
                  {viewMode === 'new' && 'Enter broker information to generate a personalized roadmap'}
                  {viewMode === 'edit' && `Editing ${editingProfile?.broker_name}`}
                </p>
              </div>

              {viewMode === 'list' && (
                <Button
                  onClick={handleCreateNew}
                  className="h-11 px-5 bg-gold hover:bg-gold/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Roadmap
                </Button>
              )}
            </div>
          </div>

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : brokerProfiles.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E5E2DB] p-12 text-center shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No roadmaps yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first broker roadmap to get started
                  </p>
                  <Button
                    onClick={handleCreateNew}
                    className="bg-gold hover:bg-gold/90 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Roadmap
                  </Button>
                </div>
              ) : (
                brokerProfiles.map((bp) => (
                  <div
                    key={bp.id}
                    className="bg-white rounded-xl border border-[#E5E2DB] p-5 shadow-sm hover:border-gold/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-foreground">
                            {bp.broker_name}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPhaseColor(bp.months_in_business)}`}>
                            {getPhaseName(bp.months_in_business)}
                          </span>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            {bp.book_size} clients
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Target className="w-4 h-4" />
                            {bp.monthly_goal} plans/mo goal
                          </span>
                          {bp.last_generated_at && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              Generated {formatDistanceToNow(new Date(bp.last_generated_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateFromList(bp)}
                          disabled={generatingId === bp.id}
                          className="h-9"
                        >
                          {generatingId === bp.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          {bp.last_generated_at ? 'Regenerate' : 'Generate'}
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(bp.id!)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setProfileToDelete(bp.id!);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Form View (New/Edit) */}
          {(viewMode === 'new' || viewMode === 'edit') && (
            <BrokerProfileForm
              initialData={editingProfile || undefined}
              managerName={managerName}
              managerId={managerId}
              onSubmit={handleSave}
              onGenerate={handleGenerate}
              isSubmitting={saving}
              isGenerating={generating}
            />
          )}

        </div>
      </main>

      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Broker Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this broker profile and any associated roadmap data.
              This action cannot be undone.
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
