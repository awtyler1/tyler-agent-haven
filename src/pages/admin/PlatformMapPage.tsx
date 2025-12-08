import { useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PlatformMapPage() {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header - hidden in print */}
      <div className="print:hidden bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/super')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Printable Content */}
      <div className="container mx-auto px-8 py-8 max-w-5xl">
        {/* Cover */}
        <div className="text-center mb-12 pb-8 border-b-2 border-gray-300">
          <h1 className="text-4xl font-bold mb-2">Tyler Insurance Group</h1>
          <h2 className="text-2xl text-gray-600 mb-4">Platform Architecture Map</h2>
          <p className="text-gray-500">Generated {new Date().toLocaleDateString()}</p>
        </div>

        {/* Page Structure */}
        <section className="mb-12 page-break-after">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b">1. Platform Pages Overview</h2>
          
          <div className="grid grid-cols-2 gap-8">
            {/* Authentication */}
            <div className="border rounded-lg p-4 bg-amber-50">
              <h3 className="font-bold text-lg mb-3 text-amber-800">🔐 Authentication (3 pages)</h3>
              <ul className="space-y-2 text-sm">
                <li><code className="bg-white px-2 py-0.5 rounded">/auth</code> — Login Page</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/auth/set-password</code> — New User Password Setup</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/auth/forgot-password</code> — Password Recovery</li>
              </ul>
            </div>

            {/* Admin */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-bold text-lg mb-3 text-blue-800">👑 Admin Dashboard (6 pages)</h3>
              <ul className="space-y-2 text-sm">
                <li><code className="bg-white px-2 py-0.5 rounded">/admin/super</code> — Super Admin Dashboard</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/admin/users/:id</code> — User Detail Page</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/admin</code> — Admin Dashboard</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/admin/agents</code> — Agents List</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/admin/agents/new</code> — Create Agent</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/admin/documents</code> — Document Management</li>
              </ul>
            </div>

            {/* Agent Onboarding */}
            <div className="border rounded-lg p-4 bg-pink-50">
              <h3 className="font-bold text-lg mb-3 text-pink-800">📋 Agent Onboarding (1 page)</h3>
              <ul className="space-y-2 text-sm">
                <li><code className="bg-white px-2 py-0.5 rounded">/contracting</code> — Submit Contracting Form</li>
              </ul>
            </div>

            {/* Main Platform */}
            <div className="border rounded-lg p-4 bg-emerald-50">
              <h3 className="font-bold text-lg mb-3 text-emerald-800">🏠 Main Platform (3 pages)</h3>
              <ul className="space-y-2 text-sm">
                <li><code className="bg-white px-2 py-0.5 rounded">/</code> — Homepage</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/start-here</code> — Getting Started Guide</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/contracting-hub</code> — Contracting Hub</li>
              </ul>
            </div>

            {/* Training */}
            <div className="border rounded-lg p-4 bg-indigo-50">
              <h3 className="font-bold text-lg mb-3 text-indigo-800">📚 Training & Compliance (5 pages)</h3>
              <ul className="space-y-2 text-sm">
                <li><code className="bg-white px-2 py-0.5 rounded">/sales-training</code> — Sales Training</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/sales-training-module</code> — Training Module</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/training-library</code> — Training Library</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/medicare-fundamentals</code> — Medicare Basics</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/compliance</code> — Compliance Center</li>
              </ul>
            </div>

            {/* Carrier Resources */}
            <div className="border rounded-lg p-4 bg-fuchsia-50">
              <h3 className="font-bold text-lg mb-3 text-fuchsia-800">🏢 Carrier Resources (4 pages)</h3>
              <ul className="space-y-2 text-sm">
                <li><code className="bg-white px-2 py-0.5 rounded">/carrier-resources</code> — Carrier Resources</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/carrier-resources/plans</code> — Plan Details</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/certifications</code> — Certifications</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/carrier-portals</code> — Carrier Portals</li>
              </ul>
            </div>

            {/* Agent Tools */}
            <div className="border rounded-lg p-4 bg-orange-50">
              <h3 className="font-bold text-lg mb-3 text-orange-800">🛠️ Agent Tools (2 pages)</h3>
              <ul className="space-y-2 text-sm">
                <li><code className="bg-white px-2 py-0.5 rounded">/agent-tools</code> — Agent Tools</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/forms-library</code> — Forms Library</li>
              </ul>
            </div>

            {/* Info Pages */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-bold text-lg mb-3 text-gray-800">ℹ️ Info Pages (3 pages)</h3>
              <ul className="space-y-2 text-sm">
                <li><code className="bg-white px-2 py-0.5 rounded">/industry-updates</code> — Industry News</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/contact</code> — Contact Us</li>
                <li><code className="bg-white px-2 py-0.5 rounded">/about</code> — About TIG</li>
              </ul>
            </div>
          </div>
        </section>

        {/* User Journeys */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b">2. User Journeys</h2>
          
          {/* New User Journey */}
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-4">New User Onboarding Flow</h3>
            <div className="flex items-center flex-wrap gap-2 text-sm">
              <div className="bg-blue-100 border border-blue-300 rounded px-3 py-2">
                Super Admin<br/>creates user
              </div>
              <span className="text-2xl">→</span>
              <div className="bg-blue-100 border border-blue-300 rounded px-3 py-2">
                Email sent with<br/>setup link
              </div>
              <span className="text-2xl">→</span>
              <div className="bg-amber-100 border border-amber-300 rounded px-3 py-2">
                User clicks<br/>email link
              </div>
              <span className="text-2xl">→</span>
              <div className="bg-amber-100 border border-amber-300 rounded px-3 py-2">
                /auth/set-password
              </div>
              <span className="text-2xl">→</span>
              <div className="bg-pink-100 border border-pink-300 rounded px-3 py-2">
                /contracting<br/>(if agent)
              </div>
              <span className="text-2xl">→</span>
              <div className="bg-emerald-100 border border-emerald-300 rounded px-3 py-2">
                Full platform<br/>access
              </div>
            </div>
          </div>

          {/* Admin Workflow */}
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-4">Admin User Management Workflow</h3>
            <div className="flex items-center flex-wrap gap-2 text-sm">
              <div className="bg-blue-100 border border-blue-300 rounded px-3 py-2">
                /admin/super<br/>Dashboard
              </div>
              <span className="text-2xl">→</span>
              <div className="bg-blue-100 border border-blue-300 rounded px-3 py-2">
                Create user or<br/>click existing
              </div>
              <span className="text-2xl">→</span>
              <div className="bg-blue-100 border border-blue-300 rounded px-3 py-2">
                /admin/users/:id<br/>User Detail
              </div>
              <span className="text-2xl">→</span>
              <div className="bg-blue-100 border border-blue-300 rounded px-3 py-2">
                Update role,<br/>status, resend link
              </div>
            </div>
          </div>

          {/* Agent Daily Use */}
          <div>
            <h3 className="font-bold text-lg mb-4">Agent Daily Platform Use</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="bg-emerald-100 border border-emerald-300 rounded px-3 py-2 mb-2">
                  Homepage /
                </div>
                <span className="text-gray-500">Entry point</span>
              </div>
              <div className="text-center">
                <div className="bg-indigo-100 border border-indigo-300 rounded px-3 py-2 mb-2">
                  Training & Certs
                </div>
                <span className="text-gray-500">Learn & certify</span>
              </div>
              <div className="text-center">
                <div className="bg-fuchsia-100 border border-fuchsia-300 rounded px-3 py-2 mb-2">
                  Carrier Resources
                </div>
                <span className="text-gray-500">Plans & portals</span>
              </div>
            </div>
          </div>
        </section>

        {/* User Roles & Access */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b">3. User Roles & Access</h2>
          
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Role</th>
                <th className="border p-3 text-left">Access</th>
                <th className="border p-3 text-left">Key Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-3 font-medium">Super Admin</td>
                <td className="border p-3">All pages + /admin/super</td>
                <td className="border p-3">Create users, assign roles, manage system</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border p-3 font-medium">Contracting Admin</td>
                <td className="border p-3">All pages + /admin</td>
                <td className="border p-3">Manage agent contracting, view agents</td>
              </tr>
              <tr>
                <td className="border p-3 font-medium">Broker Manager</td>
                <td className="border p-3">All pages + team view</td>
                <td className="border p-3">View team members, training oversight</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border p-3 font-medium">Agent</td>
                <td className="border p-3">Main platform pages</td>
                <td className="border p-3">Training, certifications, carrier tools</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Onboarding Statuses */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b">4. Onboarding Status Flow</h2>
          
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="bg-red-100 border-2 border-red-400 rounded-lg px-4 py-3 text-center">
              <div className="font-bold text-red-800">CONTRACTING_REQUIRED</div>
              <div className="text-red-600 text-xs mt-1">New agent, needs paperwork</div>
            </div>
            <span className="text-3xl">→</span>
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg px-4 py-3 text-center">
              <div className="font-bold text-yellow-800">CONTRACT_SUBMITTED</div>
              <div className="text-yellow-600 text-xs mt-1">Awaiting approval</div>
            </div>
            <span className="text-3xl">→</span>
            <div className="bg-green-100 border-2 border-green-400 rounded-lg px-4 py-3 text-center">
              <div className="font-bold text-green-800">APPOINTED</div>
              <div className="text-green-600 text-xs mt-1">Full access granted</div>
            </div>
          </div>
          <div className="text-center mt-4">
            <div className="inline-block bg-gray-100 border-2 border-gray-400 rounded-lg px-4 py-3 text-center">
              <div className="font-bold text-gray-800">SUSPENDED</div>
              <div className="text-gray-600 text-xs mt-1">Access revoked</div>
            </div>
          </div>
        </section>

        {/* Summary Stats */}
        <section className="border-t-2 border-gray-300 pt-8">
          <h2 className="text-2xl font-bold mb-6">Summary</h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-3xl font-bold">27</div>
              <div className="text-sm text-gray-600">Total Pages</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-3xl font-bold">4</div>
              <div className="text-sm text-gray-600">User Roles</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-3xl font-bold">4</div>
              <div className="text-sm text-gray-600">Onboarding States</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-3xl font-bold">8</div>
              <div className="text-sm text-gray-600">Functional Areas</div>
            </div>
          </div>
        </section>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break-after { page-break-after: always; }
          @page { margin: 0.5in; }
        }
      `}</style>
    </div>
  );
}