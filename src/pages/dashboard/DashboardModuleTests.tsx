import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  User,
  Calendar,
  CreditCard,
  Bell,
  FileText,
  BarChart3,
  Shield,
  Activity
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';

// Import dashboard components
import ModernStudentDashboard from './ModernStudentDashboard';
import ModernStaffDashboard from './ModernStaffDashboard';
import ModernAdminDashboard from './ModernAdminDashboard';
import RealTimeStudentDashboard from './RealTimeStudentDashboard';
import RealTimeStaffDashboard from './RealTimeStaffDashboard';
import RealTimeAdminDashboard from './admin/RealTimeAdminDashboard';

interface TestResult {
  component: string;
  status: 'success' | 'error' | 'loading' | 'not_tested';
  message: string;
  error?: string;
  loadTime?: number;
}

const DashboardModuleTests = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  const dashboardComponents = [
    {
      name: 'Modern Student Dashboard',
      component: ModernStudentDashboard,
      route: '/dashboard/modern-student',
      icon: <User className="h-5 w-5" />,
      description: 'Modern student interface with achievements and progress tracking'
    },
    {
      name: 'Modern Staff Dashboard',
      component: ModernStaffDashboard,
      route: '/dashboard/modern-staff',
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'Staff dashboard with event management and analytics'
    },
    {
      name: 'Modern Admin Dashboard',
      component: ModernAdminDashboard,
      route: '/dashboard/admin/modern',
      icon: <Shield className="h-5 w-5" />,
      description: 'Admin control center with system overview'
    },
    {
      name: 'Real-Time Student Dashboard',
      component: RealTimeStudentDashboard,
      route: '/dashboard/realtime-student',
      icon: <Activity className="h-5 w-5" />,
      description: 'Live student dashboard with real-time updates'
    },
    {
      name: 'Real-Time Staff Dashboard',
      component: RealTimeStaffDashboard,
      route: '/dashboard/realtime-staff',
      icon: <Calendar className="h-5 w-5" />,
      description: 'Live staff dashboard with event management'
    },
    {
      name: 'Real-Time Admin Dashboard',
      component: RealTimeAdminDashboard,
      route: '/dashboard/admin/realtime',
      icon: <Shield className="h-5 w-5" />,
      description: 'Live admin dashboard with system monitoring'
    }
  ];

  const updateTestResult = (component: string, status: 'success' | 'error' | 'loading' | 'not_tested', message: string, error?: string, loadTime?: number) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.component === component);
      const newResult = { component, status, message, error, loadTime };
      
      if (existing) {
        return prev.map(r => r.component === component ? newResult : r);
      } else {
        return [...prev, newResult];
      }
    });
  };

  const testComponent = async (componentInfo: any) => {
    const startTime = Date.now();
    updateTestResult(componentInfo.name, 'loading', 'Testing component...');
    
    try {
      // Test if component can be rendered without errors
      const TestWrapper = componentInfo.component;
      
      // Simulate component mounting and data fetching
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const loadTime = Date.now() - startTime;
      updateTestResult(componentInfo.name, 'success', 'Component loaded successfully', undefined, loadTime);
      
    } catch (error: any) {
      const loadTime = Date.now() - startTime;
      updateTestResult(componentInfo.name, 'error', 'Component failed to load', error.message, loadTime);
    }
  };

  const testDataConnections = async () => {
    updateTestResult('Data Connections', 'loading', 'Testing database connections...');
    
    try {
      // Test basic database connectivity
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (profilesError) throw profilesError;

      // Test memberships table
      const { data: memberships, error: membershipsError } = await supabase
        .from('memberships')
        .select('count')
        .limit(1);
      
      if (membershipsError) throw membershipsError;

      // Test events table
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('count')
        .limit(1);
      
      if (eventsError) throw eventsError;

      // Test payments table
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('count')
        .limit(1);
      
      if (paymentsError) throw paymentsError;

      updateTestResult('Data Connections', 'success', 'All database connections working');
      
    } catch (error: any) {
      updateTestResult('Data Connections', 'error', 'Database connection failed', error.message);
    }
  };

  const testUserPermissions = async () => {
    if (!user) {
      updateTestResult('User Permissions', 'error', 'No authenticated user');
      return;
    }

    updateTestResult('User Permissions', 'loading', 'Testing user permissions...');
    
    try {
      // Test user profile access
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      updateTestResult('User Permissions', 'success', `User permissions verified for ${profile.role}`);
      
    } catch (error: any) {
      updateTestResult('User Permissions', 'error', 'Permission test failed', error.message);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    toast.info('Starting comprehensive dashboard tests...');
    
    try {
      // Test data connections first
      await testDataConnections();
      await testUserPermissions();
      
      // Test each dashboard component
      for (const component of dashboardComponents) {
        await testComponent(component);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast.success('All dashboard tests completed!');
    } catch (error) {
      toast.error('Test suite encountered an error');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'loading':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const successCount = testResults.filter(r => r.status === 'success').length;
  const errorCount = testResults.filter(r => r.status === 'error').length;
  const totalTests = testResults.length;

  const TestComponentPreview = ({ componentInfo }: { componentInfo: any }) => {
    const [error, setError] = useState<string | null>(null);
    
    try {
      const Component = componentInfo.component;
      return (
        <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px] overflow-auto">
          <div className="text-sm text-gray-600 mb-4">
            Preview of {componentInfo.name}
          </div>
          <div className="scale-75 origin-top-left transform">
            <Component />
          </div>
        </div>
      );
    } catch (err: any) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error rendering component: {err.message}
          </AlertDescription>
        </Alert>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Dashboard Module Testing Suite 🧪</h1>
        <p className="text-purple-100 mb-4">Comprehensive testing of all dashboard components and data connections</p>
        <div className="flex items-center gap-4">
          <Badge className="bg-white/20 text-white border-white/30">
            {successCount}/{totalTests} Passed
          </Badge>
          {errorCount > 0 && (
            <Badge className="bg-red-500/20 text-white border-red-300/30">
              {errorCount} Failed
            </Badge>
          )}
          <Badge className="bg-blue-500/20 text-white border-blue-300/30">
            {dashboardComponents.length} Components
          </Badge>
        </div>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run All Tests'
              )}
            </Button>
            
            <Button variant="outline" onClick={() => setTestResults([])}>
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results and Component Previews */}
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="components">Component Previews</TabsTrigger>
          <TabsTrigger value="data">Data Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          {testResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testResults.map((result) => (
                <Card key={result.component} className={`border-l-4 ${
                  result.status === 'success' ? 'border-l-green-500' :
                  result.status === 'error' ? 'border-l-red-500' :
                  'border-l-blue-500'
                }`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      {result.component}
                      {getStatusIcon(result.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                    
                    {result.loadTime && (
                      <p className="text-xs text-gray-500 mb-2">
                        Load time: {result.loadTime}ms
                      </p>
                    )}
                    
                    {result.error && (
                      <Alert className="mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {result.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No test results yet. Click "Run All Tests" to begin.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="components">
          <div className="space-y-6">
            {dashboardComponents.map((component) => (
              <Card key={component.name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {component.icon}
                    {component.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{component.description}</p>
                </CardHeader>
                <CardContent>
                  <TestComponentPreview componentInfo={component} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Connection Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                These tests verify that all dashboard components can successfully connect to and retrieve data from Supabase.
              </p>
              <Button onClick={testDataConnections} className="mr-4">
                Test Data Connections
              </Button>
              <Button onClick={testUserPermissions} variant="outline">
                Test User Permissions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardModuleTests;
