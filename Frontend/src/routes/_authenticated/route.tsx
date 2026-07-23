import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Users, History, Trophy, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.navigate({ to: "/auth", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/pelada" className="flex items-center gap-2 font-semibold">
            <span className="text-xl">⚽</span>
            <span>Pelada Hawai</span>
          </Link>
          <button
            onClick={signOut}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 border-t border-border bg-card/95 backdrop-blur z-20">
        <div className="max-w-3xl mx-auto grid grid-cols-3">
          <NavItem to="/pelada" icon={<Trophy className="w-5 h-5" />} label="Pelada" />
          <NavItem to="/jogadores" icon={<Users className="w-5 h-5" />} label="Jogadores" />
          <NavItem to="/historico" icon={<History className="w-5 h-5" />} label="Histórico" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="py-2.5 flex flex-col items-center gap-0.5 text-xs text-muted-foreground"
      activeProps={{ className: "py-2.5 flex flex-col items-center gap-0.5 text-xs text-primary" }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
