import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flag, Plus, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function FeatureFlagsPage() {
  const navigate = useNavigate();
  const { flags, loading, toggleFlag, createFlag, deleteFlag, refetch } = useFeatureFlags();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFlagKey, setNewFlagKey] = useState('');
  const [newFlagDescription, setNewFlagDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateFlag = async () => {
    if (!newFlagKey.trim()) {
      toast.error('Flag key is required');
      return;
    }

    // Validate flag key format (snake_case)
    const validKeyPattern = /^[a-z][a-z0-9_]*$/;
    if (!validKeyPattern.test(newFlagKey)) {
      toast.error('Flag key must be lowercase with underscores (e.g., my_feature_flag)');
      return;
    }

    setIsCreating(true);
    const success = await createFlag(newFlagKey, newFlagDescription, false);
    setIsCreating(false);

    if (success) {
      toast.success(`Feature flag "${newFlagKey}" created`);
      setNewFlagKey('');
      setNewFlagDescription('');
      setIsCreateOpen(false);
    } else {
      toast.error('Failed to create feature flag');
    }
  };

  const handleToggle = async (flagKey: string, currentValue: boolean) => {
    const success = await toggleFlag(flagKey);
    if (success) {
      toast.success(`${flagKey} is now ${!currentValue ? 'enabled' : 'disabled'}`);
    } else {
      toast.error('Failed to toggle feature flag');
    }
  };

  const handleDelete = async (flagKey: string) => {
    const success = await deleteFlag(flagKey);
    if (success) {
      toast.success(`Feature flag "${flagKey}" deleted`);
    } else {
      toast.error('Failed to delete feature flag');
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/developer')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Feature Flags</h1>
              <p className="text-muted-foreground">Toggle features on/off without deploying code</p>
            </div>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Flag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
                <DialogDescription>
                  Add a new feature flag to control feature rollout.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="flagKey">Flag Key</Label>
                  <Input
                    id="flagKey"
                    placeholder="my_new_feature"
                    value={newFlagKey}
                    onChange={(e) => setNewFlagKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use snake_case (e.g., enable_dark_mode, show_beta_features)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What does this flag control?"
                    value={newFlagDescription}
                    onChange={(e) => setNewFlagDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFlag} disabled={isCreating}>
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Flag
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Flags List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : flags.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Flag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Feature Flags</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first feature flag to start controlling feature rollout.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Flag
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {flags.map((flag) => (
              <Card key={flag.id} className={flag.flag_value ? 'border-green-200 bg-green-50/30' : ''}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-muted rounded-lg">
                      {flag.flag_value ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-medium">{flag.flag_key}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          flag.flag_value 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {flag.flag_value ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {flag.description || 'No description'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Switch
                      checked={flag.flag_value}
                      onCheckedChange={() => handleToggle(flag.flag_key, flag.flag_value)}
                    />
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Feature Flag</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{flag.flag_key}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(flag.flag_key)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Using Feature Flags in Code</CardTitle>
            <CardDescription>
              Import the useFeatureFlags hook to check flag values in your components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`import { useFeatureFlags } from '@/hooks/useFeatureFlags';

function MyComponent() {
  const { isEnabled } = useFeatureFlags();
  
  if (isEnabled('my_feature_flag')) {
    return <NewFeature />;
  }
  
  return <OldFeature />;
}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
