import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Edit2, Trash2, Loader2, Building2, Users } from 'lucide-react';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HierarchyEntity {
  id: string;
  name: string;
  entity_type: 'team' | 'mga' | 'ga';
  parent_entity_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function HierarchyManagementPage() {
  const [entities, setEntities] = useState<HierarchyEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<HierarchyEntity | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    entity_type: 'team' as 'team' | 'mga' | 'ga',
    is_active: true,
  });

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hierarchy_entities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntities(data || []);
    } catch (err: any) {
      console.error('Error fetching hierarchy entities:', err);
      toast.error('Failed to load hierarchy entities');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (entity?: HierarchyEntity) => {
    if (entity) {
      setEditingEntity(entity);
      setFormData({
        name: entity.name,
        entity_type: entity.entity_type,
        is_active: entity.is_active,
      });
    } else {
      setEditingEntity(null);
      setFormData({
        name: '',
        entity_type: 'team',
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEntity(null);
    setFormData({
      name: '',
      entity_type: 'team',
      is_active: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      if (editingEntity) {
        // Update existing entity
        const { error } = await supabase
          .from('hierarchy_entities')
          .update({
            name: formData.name.trim(),
            entity_type: formData.entity_type,
            is_active: formData.is_active,
          })
          .eq('id', editingEntity.id);

        if (error) throw error;
        toast.success('Hierarchy entity updated successfully');
      } else {
        // Create new entity
        const { error } = await supabase
          .from('hierarchy_entities')
          .insert({
            name: formData.name.trim(),
            entity_type: formData.entity_type,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast.success('Hierarchy entity created successfully');
      }

      handleCloseDialog();
      fetchEntities();
    } catch (err: any) {
      console.error('Error saving hierarchy entity:', err);
      toast.error(err.message || 'Failed to save hierarchy entity');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hierarchy entity? This may affect agent assignments.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('hierarchy_entities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Hierarchy entity deleted successfully');
      fetchEntities();
    } catch (err: any) {
      console.error('Error deleting hierarchy entity:', err);
      toast.error(err.message || 'Failed to delete hierarchy entity');
    }
  };

  const teams = entities.filter(e => e.entity_type === 'team' && e.is_active);
  const mgas = entities.filter(e => e.entity_type === 'mga' && e.is_active);
  const gas = entities.filter(e => e.entity_type === 'ga' && e.is_active);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />

      <main className="flex-1 pt-28 pb-12">
        <div className="container-narrow px-6 md:px-12 lg:px-20 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/admin">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-serif font-semibold text-foreground">Hierarchy Management</h1>
                <p className="text-sm text-muted-foreground">Manage teams, MGAs, and GAs for agent assignments</p>
              </div>
            </div>

            <Button onClick={() => handleOpenDialog()} className="bg-gold hover:bg-gold/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Entity
            </Button>
          </div>

          {/* Info Card */}
          <Card className="mb-6 border-[#E5E2DB]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gold" />
                About Hierarchy Entities
              </CardTitle>
              <CardDescription>
                Hierarchy entities determine how agents are organized and who can view them. Teams are the most common type used for agent assignments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-semibold flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-gold" />
                    Teams ({teams.length})
                  </div>
                  <p className="text-muted-foreground">Groups of agents (e.g., A&A, Sales Team)</p>
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-gold" />
                    MGAs ({mgas.length})
                  </div>
                  <p className="text-muted-foreground">Managing General Agents</p>
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-gold" />
                    GAs ({gas.length})
                  </div>
                  <p className="text-muted-foreground">General Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entities Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gold" />
            </div>
          ) : (
            <Card className="border-[#E5E2DB]">
              <CardHeader>
                <CardTitle>All Entities</CardTitle>
                <CardDescription>
                  {entities.length} total entity{entities.length !== 1 ? 'ies' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {entities.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">No hierarchy entities found</p>
                    <Button onClick={() => handleOpenDialog()} className="bg-gold hover:bg-gold/90 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Entity
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entities.map((entity) => (
                        <TableRow key={entity.id}>
                          <TableCell className="font-medium">{entity.name}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 text-xs rounded-full bg-muted uppercase">
                              {entity.entity_type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              entity.is_active 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {entity.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(entity.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(entity)}
                                className="h-8 w-8"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(entity.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingEntity ? 'Edit Hierarchy Entity' : 'Create Hierarchy Entity'}
              </DialogTitle>
              <DialogDescription>
                {editingEntity 
                  ? 'Update the hierarchy entity details below.'
                  : 'Create a new team, MGA, or GA that agents can be assigned to.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., A&A, Sales Team, North Region"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="border-[#E5E2DB]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entity_type">Entity Type *</Label>
                <Select
                  value={formData.entity_type}
                  onValueChange={(value: 'team' | 'mga' | 'ga') => 
                    setFormData(prev => ({ ...prev, entity_type: value }))
                  }
                >
                  <SelectTrigger className="border-[#E5E2DB]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="mga">MGA (Managing General Agent)</SelectItem>
                    <SelectItem value="ga">GA (General Agent)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Most agents are assigned to teams. Use MGA or GA for specialized organizational structures.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_active" className="font-normal cursor-pointer">
                  Active (inactive entities won't appear in assignment dropdowns)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                className="border-[#E5E2DB]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gold hover:bg-gold/90 text-white"
              >
                {editingEntity ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

