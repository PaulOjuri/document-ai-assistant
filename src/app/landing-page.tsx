'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload, Mic, Users, BarChart3, Calendar, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

export function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading or landing page
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-[var(--primary-green)] rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">DA</span>
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--light-green)] to-white">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[var(--primary-green)] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DA</span>
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Document AI Assistant</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/auth/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/login">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 text-center max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-[var(--foreground)] mb-6">
          Your AI-Powered SAFe & Agile
          <br />
          <span className="text-[var(--primary-green)]">Document Assistant</span>
        </h1>
        <p className="text-xl text-[var(--muted-foreground)] mb-8 max-w-3xl mx-auto">
          Streamline your Product Owner workflow with intelligent document management,
          note-taking, audio transcription, and AI guidance for SAFe methodologies.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Link href="/auth/login">
            <Button size="lg" className="px-8">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Button variant="outline" size="lg">
            Watch Demo
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need for SAFe Success</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <FileText className="w-10 h-10 text-[var(--primary-green)] mb-4" />
              <CardTitle>Smart Document Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted-foreground)]">
                Organize your epics, features, and user stories with intelligent tagging
                and SAFe artifact classification.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Mic className="w-10 h-10 text-[var(--primary-green)] mb-4" />
              <CardTitle>Meeting Transcription</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted-foreground)]">
                Record and transcribe PI planning, retrospectives, and daily standups
                with searchable meeting notes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-10 h-10 text-[var(--primary-green)] mb-4" />
              <CardTitle>SAFe AI Guidance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted-foreground)]">
                Get expert advice on INVEST criteria, WSJF prioritization,
                and acceptance criteria generation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Upload className="w-10 h-10 text-[var(--primary-green)] mb-4" />
              <CardTitle>Drag & Drop Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted-foreground)]">
                Upload PDFs, Word docs, and text files with automatic content
                extraction and indexing.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-10 h-10 text-[var(--primary-green)] mb-4" />
              <CardTitle>Analytics & Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted-foreground)]">
                Track team velocity, story quality metrics, and get insights
                for continuous improvement.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-10 h-10 text-[var(--primary-green)] mb-4" />
              <CardTitle>Real-time Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[var(--muted-foreground)]">
                Collaborate with your team in real-time with live updates
                and synchronized workspaces.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SAFe Benefits */}
      <section className="px-6 py-16 bg-[var(--muted)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Built for SAFe & Agile Excellence
              </h2>
              <p className="text-lg text-[var(--muted-foreground)] mb-8">
                Our AI assistant understands SAFe principles, Agile methodologies,
                and Product Owner responsibilities to provide contextual guidance.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-[var(--primary-green)]" />
                  <span>Program Increment (PI) Planning support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-[var(--primary-green)]" />
                  <span>INVEST criteria validation for user stories</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-[var(--primary-green)]" />
                  <span>WSJF prioritization recommendations</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-[var(--primary-green)]" />
                  <span>Automated acceptance criteria generation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-[var(--primary-green)]" />
                  <span>Stakeholder communication templates</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-[var(--primary-green)] mb-2">10</div>
                  <p className="text-sm text-[var(--muted-foreground)]">SAFe Principles</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-[var(--primary-green)] mb-2">7</div>
                  <p className="text-sm text-[var(--muted-foreground)]">Core Competencies</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-[var(--primary-green)] mb-2">24/7</div>
                  <p className="text-sm text-[var(--muted-foreground)]">AI Guidance</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-[var(--primary-green)] mb-2">∞</div>
                  <p className="text-sm text-[var(--muted-foreground)]">Document Storage</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">
          Ready to Transform Your Product Owner Workflow?
        </h2>
        <p className="text-lg text-[var(--muted-foreground)] mb-8">
          Join thousands of Product Owners who use our AI assistant to excel in SAFe environments.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Link href="/auth/login">
            <Button size="lg" className="px-8">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <div className="text-sm text-[var(--muted-foreground)]">
            No credit card required • 14-day free trial
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[var(--border)] text-center text-[var(--muted-foreground)]">
        <p>&copy; 2024 Document AI Assistant. Built for SAFe & Agile Excellence.</p>
      </footer>
    </div>
  );
}