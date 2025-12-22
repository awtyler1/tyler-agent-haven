import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Building2, Package, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { HierarchyManagement } from '@/components/admin/HierarchyManagement';
import { CarrierManagement } from '@/components/admin/CarrierManagement';
import { StateDefaultsManagement } from '@/components/admin/StateDefaultsManagement';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#FEFDFB] via-[#FDFBF7] to-[#FAF8F3]">
      <Navigation />

      <main className="flex-1 pt-28 pb-12">
        <div className="container-narrow px-6 md:px-12 lg:px-20 max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-serif font-semibold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">System configuration and user management</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white border border-[#E5E2DB] p-1 h-auto">
              <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="hierarchy" className="flex items-center gap-2 data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
                <Building2 className="w-4 h-4" />
                Hierarchy
              </TabsTrigger>
              <TabsTrigger value="carriers" className="flex items-center gap-2 data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
                <Package className="w-4 h-4" />
                Carriers
              </TabsTrigger>
              <TabsTrigger value="states" className="flex items-center gap-2 data-[state=active]:bg-gold/10 data-[state=active]:text-gold">
                <MapPin className="w-4 h-4" />
                State Defaults
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <UserManagementTable />
            </TabsContent>

            <TabsContent value="hierarchy">
              <HierarchyManagement />
            </TabsContent>

            <TabsContent value="carriers">
              <CarrierManagement />
            </TabsContent>

            <TabsContent value="states">
              <StateDefaultsManagement />
            </TabsContent>
          </Tabs>

        </div>
      </main>

      <Footer />
    </div>
  );
}
