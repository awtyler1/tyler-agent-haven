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

        {/* NEW: Complete Agent Journey - Functional Map */}
        <section className="mb-12 page-break-before">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b">5. New Agent Journey — Complete Functional Map</h2>
          <p className="text-gray-600 mb-6 text-sm">Every step from creation to full platform access, showing all functions, database changes, and system interactions.</p>
          
          {/* Step 1: Admin Creates User */}
          <div className="mb-8 border-l-4 border-blue-500 pl-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</span>
              <h3 className="font-bold text-lg">Super Admin Creates User</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 rounded p-3">
                <div className="font-semibold text-blue-800 mb-2">📄 UI Page</div>
                <code className="text-xs">/admin/super</code>
                <div className="text-gray-600 mt-1">CreateUserDialog component</div>
              </div>
              <div className="bg-purple-50 rounded p-3">
                <div className="font-semibold text-purple-800 mb-2">⚡ Edge Function</div>
                <code className="text-xs">create-agent</code>
                <ul className="text-gray-600 mt-1 text-xs list-disc ml-4">
                  <li>Validates super_admin role</li>
                  <li>Creates auth.users record</li>
                  <li>Triggers handle_new_user()</li>
                </ul>
              </div>
              <div className="bg-green-50 rounded p-3">
                <div className="font-semibold text-green-800 mb-2">🗄️ Database</div>
                <ul className="text-gray-600 text-xs list-disc ml-4">
                  <li><code>auth.users</code> — new record</li>
                  <li><code>profiles</code> — auto-created by trigger</li>
                  <li><code>user_roles</code> — role assigned</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 bg-gray-50 rounded p-2 text-xs">
              <span className="font-semibold">Profile defaults:</span> onboarding_status = CONTRACTING_REQUIRED, setup_link_sent_at = null, password_created_at = null
            </div>
          </div>

          {/* Step 2: Send Setup Link */}
          <div className="mb-8 border-l-4 border-amber-500 pl-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</span>
              <h3 className="font-bold text-lg">Admin Sends Setup Link</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 rounded p-3">
                <div className="font-semibold text-blue-800 mb-2">📄 UI Page</div>
                <code className="text-xs">/admin/super</code> or <code className="text-xs">/admin/users/:id</code>
                <div className="text-gray-600 mt-1">"Send Setup Link" button</div>
              </div>
              <div className="bg-purple-50 rounded p-3">
                <div className="font-semibold text-purple-800 mb-2">⚡ Edge Function</div>
                <code className="text-xs">send-setup-link</code>
                <ul className="text-gray-600 mt-1 text-xs list-disc ml-4">
                  <li>Generates recovery link via Supabase</li>
                  <li>Sends email via Resend API</li>
                </ul>
              </div>
              <div className="bg-green-50 rounded p-3">
                <div className="font-semibold text-green-800 mb-2">🗄️ Database</div>
                <ul className="text-gray-600 text-xs list-disc ml-4">
                  <li><code>profiles.setup_link_sent_at</code> = now()</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 bg-orange-50 rounded p-2 text-xs border border-orange-200">
              <span className="font-semibold">📧 Email sent:</span> Welcome email with "Set My Password" button → links to <code>/auth/set-password</code>
            </div>
          </div>

          {/* Step 3: User Sets Password */}
          <div className="mb-8 border-l-4 border-pink-500 pl-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</span>
              <h3 className="font-bold text-lg">User Clicks Link & Sets Password</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 rounded p-3">
                <div className="font-semibold text-blue-800 mb-2">📄 UI Page</div>
                <code className="text-xs">/auth/set-password</code>
                <div className="text-gray-600 mt-1">SetPasswordPage component</div>
              </div>
              <div className="bg-purple-50 rounded p-3">
                <div className="font-semibold text-purple-800 mb-2">⚡ Supabase Auth</div>
                <code className="text-xs">supabase.auth.updateUser()</code>
                <ul className="text-gray-600 mt-1 text-xs list-disc ml-4">
                  <li>Token validated from URL</li>
                  <li>New password set</li>
                  <li>Session created</li>
                </ul>
              </div>
              <div className="bg-green-50 rounded p-3">
                <div className="font-semibold text-green-800 mb-2">🗄️ Database</div>
                <ul className="text-gray-600 text-xs list-disc ml-4">
                  <li><code>auth.users.password</code> — updated</li>
                  <li><code>profiles.password_created_at</code> = now()</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 4: First Login & Redirect */}
          <div className="mb-8 border-l-4 border-indigo-500 pl-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">4</span>
              <h3 className="font-bold text-lg">First Login & Contracting Redirect</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 rounded p-3">
                <div className="font-semibold text-blue-800 mb-2">📄 UI Page</div>
                <code className="text-xs">/auth</code> → redirects to <code className="text-xs">/contracting</code>
                <div className="text-gray-600 mt-1">ProtectedRoute checks status</div>
              </div>
              <div className="bg-purple-50 rounded p-3">
                <div className="font-semibold text-purple-800 mb-2">⚡ Frontend Logic</div>
                <code className="text-xs">ProtectedRoute.tsx</code>
                <ul className="text-gray-600 mt-1 text-xs list-disc ml-4">
                  <li>Checks onboarding_status</li>
                  <li>If CONTRACTING_REQUIRED → /contracting</li>
                </ul>
              </div>
              <div className="bg-green-50 rounded p-3">
                <div className="font-semibold text-green-800 mb-2">🗄️ Database</div>
                <ul className="text-gray-600 text-xs list-disc ml-4">
                  <li><code>profiles.first_login_at</code> = now()</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 5: Submit Contracting */}
          <div className="mb-8 border-l-4 border-rose-500 pl-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-rose-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">5</span>
              <h3 className="font-bold text-lg">Agent Submits Contracting</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 rounded p-3">
                <div className="font-semibold text-blue-800 mb-2">📄 UI Page</div>
                <code className="text-xs">/contracting</code>
                <div className="text-gray-600 mt-1">ContractingPage component</div>
              </div>
              <div className="bg-purple-50 rounded p-3">
                <div className="font-semibold text-purple-800 mb-2">⚡ Edge Function</div>
                <code className="text-xs">send-contracting-packet</code>
                <ul className="text-gray-600 mt-1 text-xs list-disc ml-4">
                  <li>Collects agent info</li>
                  <li>Sends to admin/carrier</li>
                </ul>
              </div>
              <div className="bg-green-50 rounded p-3">
                <div className="font-semibold text-green-800 mb-2">🗄️ Database</div>
                <ul className="text-gray-600 text-xs list-disc ml-4">
                  <li><code>profiles.onboarding_status</code> = CONTRACT_SUBMITTED</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 6: Admin Approves */}
          <div className="mb-8 border-l-4 border-emerald-500 pl-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">6</span>
              <h3 className="font-bold text-lg">Admin Approves → Agent Appointed</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 rounded p-3">
                <div className="font-semibold text-blue-800 mb-2">📄 UI Page</div>
                <code className="text-xs">/admin/users/:id</code>
                <div className="text-gray-600 mt-1">Change status dropdown</div>
              </div>
              <div className="bg-purple-50 rounded p-3">
                <div className="font-semibold text-purple-800 mb-2">⚡ Supabase Client</div>
                <code className="text-xs">supabase.from('profiles').update()</code>
                <ul className="text-gray-600 mt-1 text-xs list-disc ml-4">
                  <li>Direct database update</li>
                  <li>RLS policy validates admin</li>
                </ul>
              </div>
              <div className="bg-green-50 rounded p-3">
                <div className="font-semibold text-green-800 mb-2">🗄️ Database</div>
                <ul className="text-gray-600 text-xs list-disc ml-4">
                  <li><code>profiles.onboarding_status</code> = APPOINTED</li>
                  <li><code>profiles.appointed_at</code> = now()</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 bg-emerald-50 rounded p-2 text-xs border border-emerald-200">
              <span className="font-semibold">✅ Result:</span> Agent now has full platform access to all training, carrier resources, and tools.
            </div>
          </div>
        </section>

        {/* Edge Functions Reference */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b">6. Edge Functions Reference</h2>
          
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Function Name</th>
                <th className="border p-3 text-left">Purpose</th>
                <th className="border p-3 text-left">Auth Required</th>
                <th className="border p-3 text-left">External APIs</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-3 font-mono text-xs">create-agent</td>
                <td className="border p-3">Create new user account</td>
                <td className="border p-3">Super Admin only</td>
                <td className="border p-3">Resend (email)</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border p-3 font-mono text-xs">send-setup-link</td>
                <td className="border p-3">Send/resend password setup email</td>
                <td className="border p-3">Super Admin only</td>
                <td className="border p-3">Resend (email)</td>
              </tr>
              <tr>
                <td className="border p-3 font-mono text-xs">send-contracting-packet</td>
                <td className="border p-3">Submit agent contracting info</td>
                <td className="border p-3">Authenticated user</td>
                <td className="border p-3">Resend (email)</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border p-3 font-mono text-xs">validate-password</td>
                <td className="border p-3">Validate site-wide password gate</td>
                <td className="border p-3">None (public)</td>
                <td className="border p-3">None</td>
              </tr>
              <tr>
                <td className="border p-3 font-mono text-xs">agent-chat</td>
                <td className="border p-3">AI chatbot for agent questions</td>
                <td className="border p-3">None (public)</td>
                <td className="border p-3">OpenAI</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border p-3 font-mono text-xs">agent-chat-rag</td>
                <td className="border p-3">RAG-powered document search</td>
                <td className="border p-3">None (public)</td>
                <td className="border p-3">OpenAI</td>
              </tr>
              <tr>
                <td className="border p-3 font-mono text-xs">process-document</td>
                <td className="border p-3">Process PDFs for RAG embeddings</td>
                <td className="border p-3">Authenticated</td>
                <td className="border p-3">OpenAI</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Database Tables Reference */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b">7. Database Tables Reference</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3">profiles</h3>
              <ul className="text-sm space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">user_id</code> — links to auth.users</li>
                <li><code className="bg-gray-100 px-1 rounded">email</code>, <code className="bg-gray-100 px-1 rounded">full_name</code></li>
                <li><code className="bg-gray-100 px-1 rounded">onboarding_status</code> — enum</li>
                <li><code className="bg-gray-100 px-1 rounded">setup_link_sent_at</code></li>
                <li><code className="bg-gray-100 px-1 rounded">password_created_at</code></li>
                <li><code className="bg-gray-100 px-1 rounded">first_login_at</code></li>
                <li><code className="bg-gray-100 px-1 rounded">appointed_at</code></li>
                <li><code className="bg-gray-100 px-1 rounded">manager_id</code> — self-reference</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3">user_roles</h3>
              <ul className="text-sm space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">user_id</code> — links to auth.users</li>
                <li><code className="bg-gray-100 px-1 rounded">role</code> — enum: super_admin, admin, manager, agent</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3">system_config</h3>
              <ul className="text-sm space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">config_key</code> — string key</li>
                <li><code className="bg-gray-100 px-1 rounded">config_value</code> — JSONB</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3">document_chunks</h3>
              <ul className="text-sm space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">document_name</code>, <code className="bg-gray-100 px-1 rounded">carrier</code></li>
                <li><code className="bg-gray-100 px-1 rounded">chunk_text</code>, <code className="bg-gray-100 px-1 rounded">embedding</code></li>
                <li>Used for AI chatbot RAG</li>
              </ul>
            </div>
          </div>
        </section>

        {/* What's Essential vs Optional */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 pb-2 border-b">8. Essential vs Optional Components</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
              <h3 className="font-bold text-lg mb-3 text-green-800">✅ Essential for Agent Onboarding</h3>
              <ul className="text-sm space-y-2">
                <li>✓ <code>/auth</code> — Login page</li>
                <li>✓ <code>/auth/set-password</code> — Password setup</li>
                <li>✓ <code>/admin/super</code> — User management</li>
                <li>✓ <code>/admin/users/:id</code> — User detail</li>
                <li>✓ <code>/contracting</code> — Contracting form</li>
                <li>✓ <code>create-agent</code> function</li>
                <li>✓ <code>send-setup-link</code> function</li>
                <li>✓ <code>profiles</code> table</li>
                <li>✓ <code>user_roles</code> table</li>
              </ul>
            </div>
            <div className="border-2 border-gray-400 rounded-lg p-4 bg-gray-50">
              <h3 className="font-bold text-lg mb-3 text-gray-700">🔧 Optional / Can Be Simplified</h3>
              <ul className="text-sm space-y-2">
                <li>○ AI Chatbot (agent-chat, agent-chat-rag)</li>
                <li>○ Document processing (process-document)</li>
                <li>○ document_chunks table</li>
                <li>○ processing_jobs table</li>
                <li>○ Password gate (validate-password)</li>
                <li>○ Training pages (if external LMS)</li>
                <li>○ Carrier resource pages (if using portals)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Summary Stats */}
        <section className="border-t-2 border-gray-300 pt-8">
          <h2 className="text-2xl font-bold mb-6">Summary</h2>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-3xl font-bold">27</div>
              <div className="text-sm text-gray-600">Total Pages</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-3xl font-bold">7</div>
              <div className="text-sm text-gray-600">Edge Functions</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-3xl font-bold">4</div>
              <div className="text-sm text-gray-600">Database Tables</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-3xl font-bold">4</div>
              <div className="text-sm text-gray-600">User Roles</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-3xl font-bold">6</div>
              <div className="text-sm text-gray-600">Onboarding Steps</div>
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