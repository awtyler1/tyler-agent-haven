import { useNavigate } from 'react-router-dom';

import { FileText, Sparkles, MessageSquare, Heart } from 'lucide-react';

export default function LabsPage() {
  const navigate = useNavigate();

  const features = [
    {
      name: 'PDF Assistant',
      description: 'Chat with AI to create professional documents',
      icon: MessageSquare,
      path: '/admin/pdf-builder',
      status: 'Active',
    },
    {
      name: 'Medicare Plan Finder',
      description: 'Search and compare 2026 Kentucky Medicare Advantage plans',
      icon: Heart,
      path: '/plan-finder',
      status: 'In Development',
    },
    {
      name: 'Business Roadmap Generator',
      description: 'Create personalized business plans for agents',
      icon: FileText,
      path: '/admin/roadmaps',
      status: 'In Development',
    },
  ];

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-gold" />
          <h1 className="text-2xl font-serif font-medium text-foreground">Labs</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Experimental features in development</p>
      </div>

      <div className="grid gap-4 max-w-2xl">
        {features.map((feature) => (
          <button
            key={feature.path}
            onClick={() => navigate(feature.path)}
            className="flex items-center gap-4 p-4 bg-white border border-border rounded-lg hover:border-gold hover:bg-gold/5 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <feature.icon className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{feature.name}</span>
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                  {feature.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-8 max-w-2xl">
        Features here are works in progress. They may change or be removed.
      </p>
    </>
  );
}
