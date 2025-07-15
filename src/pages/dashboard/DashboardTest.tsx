import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Database,
  Users,
  Calendar,
  CreditCard,
  Bell,
  FileText
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface TestResult {
  module: string;
  status: 'success' | 'error' | 'loading';
  message: string;
  data?: any;
  error?: string;
}

const DashboardTest = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTestResult = (module: string, status: 'success' | 'error' | 'loading', message: string, data?: any, error?: string) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.module === module);
      const newResult = { module, status, message, data, error };
      
      if (existing) {
        return prev.map(r => r.module === module ? newResult : r);
      } else {
        return [...prev, newResult];
      }
    });
  };

  const testDatabaseConnection = async () => {
    updateTestResult('Database Connection', 'loading', 'Testing connection...');
    
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) throw error;
      
      updateTestResult('Database Connection', 'success', 'Successfully connected to Supabase', data);
    } catch (error: any) {
      updateTestResult('Database Connection', 'error', 'Failed to connect to database', null, error.message);
    }
  };

  const testUserProfiles = async () => {
    updateTestResult('User Profiles', 'loading', 'Testing user profiles...');
    
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      
      updateTestResult('User Profiles', 'success', `Found ${profiles?.length || 0} user profiles`, profiles);
    } catch (error: any) {
      updateTestResult('User Profiles', 'error', 'Failed to fetch user profiles', null, error.message);
    }
  };

  const testMemberships = async () => {
    updateTestResult('Memberships', 'loading', 'Testing memberships...');
    
    try {
      const { data: memberships, error } = await supabase
        .from('memberships')
        .select(`
          *,
          profiles!memberships_user_id_fkey(first_name, last_name, role)
        `)
        .limit(5);
      
      if (error) throw error;
      
      updateTestResult('Memberships', 'success', `Found ${memberships?.length || 0} memberships`, memberships);
    } catch (error: any) {
      updateTestResult('Memberships', 'error', 'Failed to fetch memberships', null, error.message);
    }
  };

  const testEvents = async () => {
    updateTestResult('Events', 'loading', 'Testing events...');
    
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          event_registrations(count)
        `)
        .limit(5);
      
      if (error) throw error;
      
      updateTestResult('Events', 'success', `Found ${events?.length || 0} events`, events);
    } catch (error: any) {
      updateTestResult('Events', 'error', 'Failed to fetch events', null, error.message);
    }
  };

  const testPayments = async () => {
    updateTestResult('Payments', 'loading', 'Testing payments...');
    
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          *,
          profiles!payments_user_id_fkey(first_name, last_name)
        `)
        .limit(5);
      
      if (error) throw error;
      
      updateTestResult('Payments', 'success', `Found ${payments?.length || 0} payments`, payments);
    } catch (error: any) {
      updateTestResult('Payments', 'error', 'Failed to fetch payments', null, error.message);
    }
  };

  const testNotifications = async () => {
    updateTestResult('Notifications', 'loading', 'Testing notifications...');
    
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      
      updateTestResult('Notifications', 'success', `Found ${notifications?.length || 0} notifications`, notifications);
    } catch (error: any) {
      updateTestResult('Notifications', 'error', 'Failed to fetch notifications', null, error.message);
    }
  };

  const testCurrentUserData = async () => {
    if (!user) {
      updateTestResult('Current User', 'error', 'No authenticated user found');
      return;
    }

    updateTestResult('Current User', 'loading', 'Testing current user data...');
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          student_details(*),
          staff_details(*)
        `)
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      updateTestResult('Current User', 'success', `User profile loaded: ${profile.first_name} ${profile.last_name} (${profile.role})`, profile);
    } catch (error: any) {
      updateTestResult('Current User', 'error', 'Failed to fetch current user data', null, error.message);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    toast.info('Starting dashboard module tests...');
    
    try {
      await testDatabaseConnection();
      await testCurrentUserData();
      await testUserProfiles();
      await testMemberships();
      await testEvents();
      await testPayments();
      await testNotifications();
      
      toast.success('All tests completed!');
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

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'Database Connection':
        return <Database className="h-5 w-5" />;
      case 'User Profiles':
      case 'Current User':
        return <Users className="h-5 w-5" />;
      case 'Events':
        return <Calendar className="h-5 w-5" />;
      case 'Payments':
        return <CreditCard className="h-5 w-5" />;
      case 'Notifications':
        return <Bell className="h-5 w-5" />;
      case 'Memberships':
        return <FileText className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const successCount = testResults.filter(r => r.status === 'success').length;
  const errorCount = testResults.filter(r => r.status === 'error').length;
  const totalTests = testResults.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Dashboard Module Testing 🧪</h1>
        <p className="text-blue-100 mb-4">Test all dashboard modules with real Supabase data</p>
        <div className="flex items-center gap-4">
          <Badge className="bg-white/20 text-white border-white/30">
            {successCount}/{totalTests} Passed
          </Badge>
          {errorCount > 0 && (
            <Badge className="bg-red-500/20 text-white border-red-300/30">
              {errorCount} Failed
            </Badge>
          )}
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
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
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

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testResults.map((result) => (
            <Card key={result.module} className={`border-l-4 ${
              result.status === 'success' ? 'border-l-green-500' :
              result.status === 'error' ? 'border-l-red-500' :
              'border-l-blue-500'
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  {getModuleIcon(result.module)}
                  {result.module}
                  {getStatusIcon(result.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                
                {result.error && (
                  <Alert className="mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {result.error}
                    </AlertDescription>
                  </Alert>
                )}
                
                {result.data && (
                  <div className="text-xs text-gray-500">
                    <details>
                      <summary className="cursor-pointer hover:text-gray-700">
                        View Data ({Array.isArray(result.data) ? result.data.length : 1} records)
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• This test suite verifies that all dashboard modules can connect to and retrieve data from Supabase</p>
          <p>• Each test checks a different aspect of the system: database connection, user profiles, memberships, events, payments, and notifications</p>
          <p>• Green checkmarks indicate successful tests, red X marks indicate failures</p>
          <p>• Click "View Data" to see the actual data returned from each test</p>
          <p>• If tests fail, check your Supabase configuration and database setup</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardTest;
