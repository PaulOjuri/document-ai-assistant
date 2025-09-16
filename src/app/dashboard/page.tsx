import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Mic, Users, BarChart3, Calendar, Zap, Bot } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch user's statistics
  const [documentsResult, notesResult, audiosResult] = await Promise.all([
    supabase
      .from('documents')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id),
    supabase
      .from('notes')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id),
    supabase
      .from('audios')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id),
  ]);

  const documentsCount = documentsResult.count || 0;
  const notesCount = notesResult.count || 0;
  const audiosCount = audiosResult.count || 0;

  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[var(--foreground)]">
            Welcome back, {user.user_metadata?.name || user.email}!
          </h1>
          <p className="text-xl text-[var(--muted-foreground)] max-w-3xl mx-auto">
            Your comprehensive SAFe & Agile companion for document management, note-taking,
            audio transcription, and intelligent AI assistance.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documentsCount}</div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Total documents uploaded
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Notes</CardTitle>
              <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notesCount}</div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Notes and templates created
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audio Files</CardTitle>
              <Mic className="h-4 w-4 text-[var(--muted-foreground)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{audiosCount}</div>
              <p className="text-xs text-[var(--muted-foreground)]">
                Meeting recordings processed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Interactions</CardTitle>
              <Zap className="h-4 w-4 text-[var(--muted-foreground)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-[var(--muted-foreground)]">
                AI assistant conversations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & SAFe Guidance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[var(--primary-green)]" />
                <span>Getting Started</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-[var(--light-green)] rounded-lg">
                <h4 className="font-medium text-[var(--dark-green)] mb-2">Welcome to Document AI Assistant!</h4>
                <p className="text-sm text-[var(--dark-green)]">
                  Start by uploading your first document or creating a folder structure
                  to organize your SAFe artifacts and Agile documentation.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[var(--primary-green)] rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Upload your first document</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Get started with document management</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[var(--accent-blue)] rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Create folder structure</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Organize by SAFe artifacts</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[var(--warning-amber)] rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Try the AI assistant</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Get SAFe and Agile guidance</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-[var(--primary-green)]" />
                <span>SAFe Guidance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-[var(--light-green)] rounded-lg">
                <h4 className="font-medium text-[var(--dark-green)] mb-2">Product Owner Best Practices</h4>
                <p className="text-sm text-[var(--dark-green)]">
                  Use this platform to manage your epics, features, and user stories
                  following SAFe principles and Agile best practices.
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-700 mb-2">AI-Powered Analysis</h4>
                <p className="text-sm text-blue-700">
                  The AI assistant can help analyze your user stories using INVEST criteria,
                  suggest prioritization with WSJF, and generate acceptance criteria.
                </p>
              </div>
              <Button variant="outline" className="w-full">
                <BarChart3 className="w-4 h-4 mr-2" />
                Learn More About SAFe
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border border-[var(--border)] rounded-lg">
                <Upload className="w-8 h-8 text-[var(--primary-green)] mb-3" />
                <h3 className="font-medium mb-2">Upload Documents</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  Add your sprint planning documents, user stories, and requirements for AI analysis.
                </p>
                <Link href="/documents">
                  <Button size="sm" className="w-full">Get Started</Button>
                </Link>
              </div>
              <div className="p-4 border border-[var(--border)] rounded-lg">
                <FileText className="w-8 h-8 text-[var(--accent-blue)] mb-3" />
                <h3 className="font-medium mb-2">Create Notes</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  Use SAFe templates for user stories, acceptance criteria, and meeting notes.
                </p>
                <Link href="/notes">
                  <Button size="sm" variant="outline" className="w-full">Create Note</Button>
                </Link>
              </div>
              <div className="p-4 border border-[var(--border)] rounded-lg">
                <Mic className="w-8 h-8 text-[var(--warning-amber)] mb-3" />
                <h3 className="font-medium mb-2">Audio</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  Record and transcribe planning sessions, retrospectives, and PI planning.
                </p>
                <Link href="/audio">
                  <Button size="sm" variant="outline" className="w-full">Audio</Button>
                </Link>
              </div>
              <div className="p-4 border border-[var(--border)] rounded-lg">
                <Bot className="w-8 h-8 text-[var(--accent-blue)] mb-3" />
                <h3 className="font-medium mb-2">SAFe AI Assistant</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  Get SAFe guidance, analyze content, and improve your Agile practices.
                </p>
                <Link href="/chat">
                  <Button size="sm" variant="outline" className="w-full">Start Chat</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}