import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — Pelada Hawai" },
      { name: "description", content: "Histórico de peladas anteriores." },
      { property: "og:title", content: "Histórico — Pelada Hawai" },
      { property: "og:description", content: "Histórico de peladas anteriores." },
    ],
  }),
  component: HistoricoPage,
});

interface PeladaRow {
  id: string;
  date: string;
  location: string;
  status: string;
  finished_at: string | null;
  created_at: string;
}
interface MatchRow {
  id: string;
  pelada_id: string;
  match_number: number;
  yellow_ids: string[];
  blue_ids: string[];
  winner: string | null;
  score_yellow: number;
  score_blue: number;
}

function HistoricoPage() {
  const [peladas, setPeladas] = useState<PeladaRow[]>([]);
  const [matches, setMatches] = useState<Record<string, MatchRow[]>>({});
  const [players, setPlayers] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);

  const load = async () => {
    const [{ data: peladasData, error: e1 }, { data: playersData }] = await Promise.all([
      supabase
        .from("peladas")
        .select("id, date, location, status, finished_at, created_at")
        .eq("status", "finished")
        .order("date", { ascending: false }),
      supabase.from("players").select("id, name"),
    ]);
    if (e1) return toast.error(e1.message);
    setPeladas((peladasData ?? []) as PeladaRow[]);
    setPlayers(Object.fromEntries((playersData ?? []).map((p: any) => [p.id, p.name])));
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (id: string) => {
    if (open === id) {
      setOpen(null);
      return;
    }
    setOpen(id);
    if (!matches[id]) {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("pelada_id", id)
        .order("match_number");
      if (error) return toast.error(error.message);
      setMatches((m) => ({ ...m, [id]: (data ?? []) as MatchRow[] }));
    }
  };

  const removePelada = async (id: string) => {
    if (!confirm("Excluir esta pelada e todas as partidas?")) return;
    const { error } = await supabase.from("peladas").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPeladas((p) => p.filter((x) => x.id !== id));
  };

  const fmtDate = (d: string) =>
    new Date(d + "T00:00").toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Peladas finalizadas</h2>
      {peladas.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma pelada finalizada ainda.</p>
      )}
      {peladas.map((p) => {
        const list = matches[p.id] ?? [];
        return (
          <Card key={p.id}>
            <CardHeader className="cursor-pointer" onClick={() => toggle(p.id)}>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="capitalize">{fmtDate(p.date)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePelada(p.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{p.location}</p>
            </CardHeader>
            {open === p.id && (
              <CardContent className="space-y-2">
                {list.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem partidas.</p>
                )}
                {list.map((m) => (
                  <div key={m.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Partida {m.match_number}</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[color:var(--team-yellow)] text-[color:var(--team-yellow-foreground)]">
                          {m.score_yellow}
                        </Badge>
                        <span className="text-muted-foreground">x</span>
                        <Badge className="bg-[color:var(--team-blue)] text-[color:var(--team-blue-foreground)]">
                          {m.score_blue}
                        </Badge>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {m.winner === "yellow"
                            ? "🟡 venceu"
                            : m.winner === "blue"
                              ? "🔵 venceu"
                              : "Empate"}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="font-semibold text-[color:var(--team-yellow)] mb-1">Amarelo</div>
                        {m.yellow_ids.map((id) => (
                          <div key={id}>{players[id] ?? "?"}</div>
                        ))}
                      </div>
                      <div>
                        <div className="font-semibold text-[color:var(--team-blue)] mb-1">Azul</div>
                        {m.blue_ids.map((id) => (
                          <div key={id}>{players[id] ?? "?"}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
