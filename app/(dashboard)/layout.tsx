import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogoutButton } from '@/components/logout-button';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-2xl font-bold">
                Echoes
              </Link>
              <nav className="flex gap-6">
                <Link
                  href="/record"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Record
                </Link>
                <Link
                  href="/timeline"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Timeline
                </Link>
                <Link
                  href="/query"
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Ask Past Self
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Echoes - A Voice Bridge Between Past and Present Selves</p>
        </div>
      </footer>
    </div>
  );
}
