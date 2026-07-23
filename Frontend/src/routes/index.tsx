import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pelada Hawai — Gerenciador de Partidas" },
      {
        name: "description",
        content:
          "App para organizar a pelada: cadastro de jogadores, formação automática de times e histórico de partidas.",
      },
      { property: "og:title", content: "Pelada Hawai — Gerenciador de Partidas" },
      {
        property: "og:description",
        content: "Organize as peladas de terça e quinta no Hawai Sport Goiânia.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.replace("/pelada");
      } else {
        setChecking(false);
      }
    });
  }, []);

  if (checking) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background via-background to-[color:var(--field)]/30">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-primary-foreground text-4xl">
          ⚽
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Pelada Hawai</h1>
          <p className="mt-2 text-muted-foreground">
            Terças e quintas · Hawai Sport Goiânia
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Cadastre jogadores, monte os times automaticamente e guarde o histórico das
          partidas.
        </p>
        <Button asChild size="lg" className="w-full">
          <Link to="/auth">Entrar para começar</Link>
        </Button>
      </div>
    </div>
  );
}
