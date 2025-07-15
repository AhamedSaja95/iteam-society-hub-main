import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Download,
  RefreshCw,
  Play,
  Shield,
  Database,
  Users,
  Calendar,
  CreditCard,
  Bell,
  Zap
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { dashboardVerification, VerificationResult } from '@/utils/dashboardVerification';

const ComprehensiveTest = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  });
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setResults([]);
    setProgress(0);
    setCurrentTest('Initializing...');
    
    toast.info('Starting comprehensive dashboard verification...');

    try {
      // Simulate progress updates
      const progressSteps = [
        'Connecting to Supabase...',
        'Verifying table access...',
        'Testing user authentication...',
        'Checking membership system...',
        'Validating event system...',
        'Testing payment system...',
        'Verifying notifications...',
        'Testing real-time features...'
      ];

      for (let i = 0; i < progressSteps.length; i++) {
        setCurrentTest(progressSteps[i]);
        setProgress((i / progressSteps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Run actual verification
      const verificationResult = await dashboardVerification.runCompleteVerification(user?.id);
      
      setResults(verificationResult.results);
      setSummary(verificationResult.summary);
      setProgress(100);
      setCurrentTest('Verification complete!');

      if (verificationResult.success) {
        toast.success(`All tests passed! ${verificationResult.summary.passed}/${verificationResult.summary.total} successful`);
      } else {
        toast.error(`${verificationResult.summary.failed} tests failed. Check results for details.`);
      }

    } catch (error: any) {
      toast.error(`Verification failed: ${error.message}`);
      console.error('Verification error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const downloadReport = () => {
    const report = dashboardVerification.generateReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-verification-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded successfully!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getModuleIcon = (module: string) => {
    if (module.includes('Supabase') || module.includes('Table')) return <Database className="h-5 w-5" />;
    if (module.includes('User') || module.includes('Authentication')) return <Users className="h-5 w-5" />;
    if (module.includes('Event')) return <Calendar className="h-5 w-5" />;
    if (module.includes('Payment')) return <CreditCard className="h-5 w-5" />;
    if (module.includes('Notification')) return <Bell className="h-5 w-5" />;
    if (module.includes('Real-Time')) return <Zap className="h-5 w-5" />;
    if (module.includes('Membership')) return <Shield className="h-5 w-5" />;
    return <AlertCircle className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Comprehensive Dashboard Verification 🔍</h1>
        <p className="text-emerald-100 mb-4">Complete system verification with real Supabase data integration</p>
        <div className="flex items-center gap-4">
          <Badge className="bg-white/20 text-white border-white/30">
            {summary.passed}/{summary.total} Tests Passed
          </Badge>
          {summary.failed > 0 && (
            <Badge className="bg-red-500/20 text-white border-red-300/30">
              {summary.failed} Failed
            </Badge>
          )}
          {summary.warnings > 0 && (
            <Badge className="bg-yellow-500/20 text-white border-yellow-300/30">
              {summary.warnings} Warnings
            </Badge>
          )}
        </div>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verification Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={runComprehensiveTest} 
                disabled={isRunning}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Verification...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Complete Verification
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setResults([])}
                disabled={isRunning}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Results
              </Button>

              {results.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={downloadReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              )}
            </div>

            {isRunning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{currentTest}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
            <TabsTrigger value="system-status">System Status</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-green-900">{summary.passed}</div>
                  <div className="text-green-700">Tests Passed</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardContent className="p-6 text-center">
                  <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-red-900">{summary.failed}</div>
                  <div className="text-red-700">Tests Failed</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-yellow-900">{summary.warnings}</div>
                  <div className="text-yellow-700">Warnings</div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>System Health Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Overall System Status</span>
                    <Badge variant={summary.failed === 0 ? "default" : "destructive"}>
                      {summary.failed === 0 ? "✅ OPERATIONAL" : "❌ ISSUES DETECTED"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Success Rate</span>
                    <span className="font-semibold">
                      {summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Modules Tested</span>
                    <span className="font-semibold">{summary.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result, index) => (
                <Card key={index} className={`border-l-4 ${
                  result.status === 'success' ? 'border-l-green-500' :
                  result.status === 'error' ? 'border-l-red-500' :
                  'border-l-yellow-500'
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
                    <p className="text-xs text-gray-400">
                      {new Date(result.timestamp).toLocaleString()}
                    </p>
                    
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-blue-600 hover:text-blue-800">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="system-status">
            <div className="space-y-4">
              <Alert className={summary.failed === 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>System Status:</strong> {summary.failed === 0 
                    ? "All systems operational and ready for production deployment." 
                    : `${summary.failed} critical issues detected. Review failed tests before deployment.`
                  }
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Production Readiness Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { name: 'Database Connectivity', status: results.some(r => r.module.includes('Supabase') && r.status === 'success') },
                      { name: 'User Authentication', status: results.some(r => r.module.includes('Authentication') && r.status === 'success') },
                      { name: 'Membership System', status: results.some(r => r.module.includes('Membership') && r.status === 'success') },
                      { name: 'Event Management', status: results.some(r => r.module.includes('Event') && r.status === 'success') },
                      { name: 'Payment Processing', status: results.some(r => r.module.includes('Payment') && r.status === 'success') },
                      { name: 'Real-time Features', status: results.some(r => r.module.includes('Real-Time') && r.status === 'success') }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{item.name}</span>
                        {item.status ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• This comprehensive verification tests all critical dashboard components and data integrations</p>
          <p>• The test suite validates database connectivity, user authentication, and all major system modules</p>
          <p>• Green results indicate successful tests, red indicates failures that need attention</p>
          <p>• Download the detailed report for documentation and troubleshooting</p>
          <p>• All tests must pass before production deployment</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveTest;
