import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Activity, 
  Database, 
  Server, 
  HardDrive,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface HealthCheck {
  name: string;
  status: 'checking' | 'healthy' | 'warning' | 'error';
  latency?: number;
  message?: string;
  lastChecked?: Date;
}

export default function SystemHealthPage() {
  const navigate = useNavigate();
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'Supabase Connection', status: 'checking' },
    { name: 'Database (Profiles)', status: 'checking' },
    { name: 'Database (Feature Flags)', status: 'checking' },
    { name: 'Edge Functions', status: 'checking' },
    { name: 'Storage', status: 'checking' },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const runHealthChecks = async () => {
    setIsRefreshing(true);
    const newChecks: HealthCheck[] = [];

    // 1. Supabase Connection
    try {
      const start = Date.now();
      const { data, error } = await supabase.auth.getSession();
      const latency = Date.now() - start;
      
      newChecks.push({
        name: 'Supabase Connection',
        status: error ? 'error' : 'healthy',
        latency,
        message: error ? error.message : `Connected (${latency}ms)`,
        lastChecked: new Date(),
      });
    } catch (err) {
      newChecks.push({
        name: 'Supabase Connection',
        status: 'error',
        message: 'Connection failed',
        lastChecked: new Date(),
      });
    }

    // 2. Database - Profiles
    try {
      const start = Date.now();
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      const latency = Date.now() - start;
      
      newChecks.push({
        name: 'Database (Profiles)',
        status: error ? 'error' : 'healthy',
        latency,
        message: error ? error.message : `${count} records (${latency}ms)`,
        lastChecked: new Date(),
      });
    } catch (err) {
      newChecks.push({
        name: 'Database (Profiles)',
        status: 'error',
        message: 'Query failed',
        lastChecked: new Date(),
      });
    }

    // 3. Database - Feature Flags
    try {
      const start = Date.now();
      const { count, error } = await supabase
        .from('feature_flags')
        .select('*', { count: 'exact', head: true });
      const latency = Date.now() - start;
      
      if (error && error.code === '42P01') {
        newChecks.push({
          name: 'Database (Feature Flags)',
          status: 'warning',
          message: 'Table not found - run migration',
          lastChecked: new Date(),
        });
      } else {
        newChecks.push({
          name: 'Database (Feature Flags)',
          status: error ? 'error' : 'healthy',
          latency,
          message: error ? error.message : `${count} flags (${latency}ms)`,
          lastChecked: new Date(),
        });
      }
    } catch (err) {
      newChecks.push({
        name: 'Database (Feature Flags)',
        status: 'error',
        message: 'Query failed',
        lastChecked: new Date(),
      });
    }

    // 4. Edge Functions
    try {
      const start = Date.now();
      const { error } = await supabase.functions.invoke('generate-contracting-pdf', {
        body: { test: true },
      });
      const latency = Date.now() - start;
      
      newChecks.push({
        name: 'Edge Functions',
        status: 'healthy',
        latency,
        message: `Reachable (${latency}ms)`,
        lastChecked: new Date(),
      });
    } catch (err: any) {
      if (err?.message?.includes('FunctionsFetchError')) {
        newChecks.push({
          name: 'Edge Functions',
          status: 'error',
          message: 'Not reachable',
          lastChecked: new Date(),
        });
      } else {
        newChecks.push({
          name: 'Edge Functions',
          status: 'warning',
          message: 'Reachable but returned error',
          lastChecked: new Date(),
        });
      }
    }

    // 5. Storage
    try {
      const start = Date.now();
      const { data, error } = await supabase.storage.listBuckets();
      const latency = Date.now() - start;
      
      newChecks.push({
        name: 'Storage',
        status: error ? 'error' : 'healthy',
        latency,
        message: error ? error.message : `${data?.length || 0} buckets (${latency}ms)`,
        lastChecked: new Date(),
      });
    } catch (err) {
      newChecks.push({
        name: 'Storage',
        status: 'error',
        message: 'Connection failed',
        lastChecked: new Date(),
      });
    }

    setChecks(newChecks);
    setIsRefreshing(false);
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'checking':
        return 'border-muted';
      case 'healthy':
        return 'border-green-200 bg-green-50/50';
      case 'warning':
        return 'border-amber-200 bg-amber-50/50';
      case 'error':
        return 'border-red-200 bg-red-50/50';
    }
  };

  const getServiceIcon = (name: string) => {
    if (name.includes('Connection')) return Database;
    if (name.includes('Database')) return Database;
    if (name.includes('Edge')) return Server;
    if (name.includes('Storage')) return HardDrive;
    return Activity;
  };

  const overallStatus = checks.every(c => c.status === 'healthy')
    ? 'healthy'
    : checks.some(c => c.status === 'error')
      ? 'error'
      : checks.some(c => c.status === 'warning')
        ? 'warning'
        : 'checking';

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
              <h1 className="text-2xl font-bold text-foreground">System Health</h1>
              <p className="text-muted-foreground">Monitor platform services and connectivity</p>
            </div>
          </div>
          
          <Button onClick={runHealthChecks} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Overall Status */}
        <Card className={`mb-8 ${getStatusColor(overallStatus)}`}>
          <CardContent className="flex items-center gap-4 p-6">
            {getStatusIcon(overallStatus)}
            <div>
              <p className="font-semibold text-lg">
                {overallStatus === 'healthy' && 'All Systems Operational'}
                {overallStatus === 'warning' && 'Some Issues Detected'}
                {overallStatus === 'error' && 'System Issues Detected'}
                {overallStatus === 'checking' && 'Checking Systems...'}
              </p>
              <p className="text-sm text-muted-foreground">
                Last checked: {checks[0]?.lastChecked?.toLocaleTimeString() || 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Individual Checks */}
        <div className="space-y-4 mb-8">
          {checks.map((check) => {
            const ServiceIcon = getServiceIcon(check.name);
            return (
              <Card key={check.name} className={getStatusColor(check.status)}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <ServiceIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{check.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {check.message || 'Checking...'}
                      </p>
                    </div>
                  </div>
                  {getStatusIcon(check.status)}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Environment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Environment</p>
                <p className="font-medium">Production</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Supabase Project</p>
                <p className="font-medium font-mono text-xs">hikhnmuckfopyzxkdeus</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Build Time</p>
                <p className="font-medium">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Platform</p>
                <p className="font-medium">Lovable</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
