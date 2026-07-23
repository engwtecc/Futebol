import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Play, Flag, Plus, X } from "lucide-react";
import { buildNextFormation, TEAM_SIZE, type ArrivalEntry } from "@/lib/match-logic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/pelada")({
  head: () => ({
    meta: [
      { title: "Pelada — Pelada Hawai" },
      { name: "description", content: "Gerencie a pelada de hoje em tempo real." },
      { property: "og:title", content: "Pelada — Pelada Hawai" },
      { property: "og:description", content: "Gerencie a pelada de hoje em tempo real." },
    ],
  }),
  component: PeladaPage,
});

interface Player {
  id: string;
  name: string;
}
interface Pelada {
  id: string;
  date: string;
  location: string;
  status: string;
  arrival_order: ArrivalEntry[];
}
interface Match {
  id: string;
  match_number: number;
  yellow_ids: string[];
  blue_ids: string[];
  winner: "yellow" | "blue" | "draw" | null;
  score_yellow: number;
  score_blue: number;
}

function PeladaPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [pelada, setPelada] = useState<Pelada | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [resultOpen, setResultOpen] = useState(false);
  const [winner, setWinner] = useState<"yellow" | "blue" | "draw">("yellow");
  const [scoreY, setScoreY] = useState("0");
  const [scoreB, setScoreB] = useState("0");

  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? "?";
  const currentMatch = matches.find((m) => m.winner === null) ?? null;
  const finishedMatches = matches.filter((m) => m.winner !== null);

  const playerMap = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players],
  );

  const gameCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of finishedMatches) {
      for (const id of m.yellow_ids) counts.set(id, (counts.get(id) ?? 0) + 1);
      for (const id of m.blue_ids) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [finishedMatches]);

  const load = async () => {
    setLoading(true);
    const [{ data: playersData }, { data: peladaData }] = await Promise.all([
      supabase.from("players").select("id, name").order("name"),
      supabase
        .from("peladas")
        .select("id, date, location, status, arrival_order")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setPlayers((playersData ?? []) as Player[]);
    if (peladaData) {
      setPelada(peladaData as any);
      const { data: matchesData } = await supabase
        .from("matches")
        .select("*")
        .eq("pelada_id", peladaData.id)
        .order("match_number");
      setMatches((matchesData ?? []) as Match[]);
    } else {
      setPelada(null);
      setMatches([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startPelada = async () => {
    const { data, error } = await supabase
      .from("peladas")
      .insert({ arrival_order: [] })
      .select("id, date, location, status, arrival_order")
      .single();
    if (error) return toast.error(error.message);
    setPelada(data as any);
    setMatches([]);
  };

  const updateArrival = async (arrival: ArrivalEntry[]) => {
    if (!pelada) return;
    setPelada({ ...pelada, arrival_order: arrival });
    const { error } = await supabase
      .from("peladas")
      .update({ arrival_order: arrival as any })
      .eq("id", pelada.id);
    if (error) toast.error(error.message);
  };

  const addToArrival = (playerId: string) => {
    if (!pelada) return;
    if (pelada.arrival_order.some((a) => a.player_id === playerId)) {
      toast.error("Jogador já está na lista");
      return;
    }
    updateArrival([...pelada.arrival_order, { player_id: playerId, active: true }]);
    setSearch("");
  };

  const toggleActive = (playerId: string) => {
    if (!pelada) return;
    updateArrival(
      pelada.arrival_order.map((a) =>
        a.player_id === playerId ? { ...a, active: !a.active } : a,
      ),
    );
  };

  const removeFromArrival = (playerId: string) => {
    if (!pelada) return;
    updateArrival(pelada.arrival_order.filter((a) => a.player_id !== playerId));
  };

  const startMatch = async () => {
    if (!pelada) return;
    if (currentMatch) return toast.error("Termine a partida atual primeiro");
    const formation = buildNextFormation(pelada.arrival_order, matches);
    if (formation.error) return toast.error(formation.error);
    const nextNumber = matches.length + 1;
    const { data, error } = await supabase
      .from("matches")
      .insert({
        pelada_id: pelada.id,
        match_number: nextNumber,
        yellow_ids: formation.yellow_ids,
        blue_ids: formation.blue_ids,
      })
      .select("*")
      .single();
    if (error) return toast.error(error.message);
    setMatches((m) => [...m, data as Match]);
  };

  const openResult = () => {
    setWinner("yellow");
    setScoreY("0");
    setScoreB("0");
    setResultOpen(true);
  };

  const saveResult = async () => {
    if (!currentMatch) return;
    const sy = parseInt(scoreY) || 0;
    const sb = parseInt(scoreB) || 0;
    const { data, error } = await supabase
      .from("matches")
      .update({
        winner,
        score_yellow: sy,
        score_blue: sb,
        finished_at: new Date().toISOString(),
      })
      .eq("id", currentMatch.id)
      .select("*")
      .single();
    if (error) return toast.error(error.message);
    setMatches((m) => m.map((x) => (x.id === data.id ? (data as Match) : x)));
    setResultOpen(false);
    toast.success("Resultado salvo");
  };

  const finishPelada = async () => {
    if (!pelada) return;
    if (currentMatch) return toast.error("Termine a partida atual primeiro");
    if (!confirm("Finalizar a pelada de hoje? Ela irá para o histórico.")) return;
    const { error } = await supabase
      .from("peladas")
      .update({ status: "finished", finished_at: new Date().toISOString() })
      .eq("id", pelada.id);
    if (error) return toast.error(error.message);
    toast.success("Pelada finalizada!");
    load();
  };

  const availableToAdd = players.filter(
    (p) =>
      !pelada?.arrival_order.some((a) => a.player_id === p.id) &&
      (search === "" || p.name.toLowerCase().includes(search.toLowerCase())),
  );

  if (loading) return <div className="text-center py-10 text-muted-foreground">Carregando…</div>;

  if (!pelada) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhuma pelada em andamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Comece uma nova pelada para adicionar jogadores e iniciar as partidas.
          </p>
          <Button size="lg" className="w-full" onClick={startPelada}>
            <Play className="w-4 h-4 mr-2" /> Iniciar pelada de hoje
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activeCount = pelada.arrival_order.filter((a) => a.active).length;

  return (
    <div className="space-y-4">
      {/* Current match */}
      {currentMatch ? (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Partida {currentMatch.match_number}</span>
              <Badge variant="secondary">Em andamento</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <TeamCard color="yellow" ids={currentMatch.yellow_ids} name={playerName} />
              <TeamCard color="blue" ids={currentMatch.blue_ids} name={playerName} />
            </div>
            <Button className="w-full" size="lg" onClick={openResult}>
              <Flag className="w-4 h-4 mr-2" /> Registrar resultado
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {matches.length === 0 ? "Pronto para começar" : `Próxima partida (${matches.length + 1})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {activeCount} jogador(es) ativo(s) · mínimo {TEAM_SIZE * 2}
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={startMatch}
              disabled={activeCount < TEAM_SIZE * 2}
            >
              <Play className="w-4 h-4 mr-2" /> Iniciar partida
            </Button>
            {matches.length > 0 && (
              <Button variant="outline" className="w-full" onClick={finishPelada}>
                Finalizar pelada e salvar no histórico
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Arrival order */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ordem de chegada ({pelada.arrival_order.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Input
              placeholder="Buscar jogador para adicionar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && availableToAdd.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-md max-h-60 overflow-auto shadow-lg">
                {availableToAdd.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    className="w-full text-left px-3 py-2 hover:bg-accent flex items-center justify-between"
                    onClick={() => addToArrival(p.id)}
                  >
                    <span>{p.name}</span>
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {pelada.arrival_order.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Adicione os jogadores conforme forem chegando.
            </p>
          ) : (
            <ul className="space-y-1">
              {pelada.arrival_order.map((entry, idx) => {
                const p = playerMap[entry.player_id];
                const games = gameCounts.get(entry.player_id) ?? 0;
                return (
                  <li
                    key={entry.player_id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50"
                  >
                    <Checkbox
                      checked={entry.active}
                      onCheckedChange={() => toggleActive(entry.player_id)}
                    />
                    <span className="text-xs text-muted-foreground w-6">{idx + 1}.</span>
                    <span
                      className={
                        entry.active ? "flex-1" : "flex-1 line-through text-muted-foreground"
                      }
                    >
                      {p?.name ?? "?"}
                    </span>
                    <span className="text-xs text-muted-foreground">{games} jogos</span>
                    <button
                      onClick={() => removeFromArrival(entry.player_id)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Finished matches summary */}
      {finishedMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Partidas de hoje ({finishedMatches.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {finishedMatches.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                <span>Partida {m.match_number}</span>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[color:var(--team-yellow)] text-[color:var(--team-yellow-foreground)]">
                    {m.score_yellow}
                  </Badge>
                  <span className="text-muted-foreground">x</span>
                  <Badge className="bg-[color:var(--team-blue)] text-[color:var(--team-blue-foreground)]">
                    {m.score_blue}
                  </Badge>
                  <span className="text-xs ml-2 text-muted-foreground">
                    {m.winner === "yellow" ? "🟡" : m.winner === "blue" ? "🔵" : "Empate"}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Result dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resultado da partida</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[color:var(--team-yellow)]">Amarelo</Label>
                <Input
                  type="number"
                  min="0"
                  value={scoreY}
                  onChange={(e) => setScoreY(e.target.value)}
                  className="text-center text-2xl h-14"
                />
              </div>
              <div>
                <Label className="text-[color:var(--team-blue)]">Azul</Label>
                <Input
                  type="number"
                  min="0"
                  value={scoreB}
                  onChange={(e) => setScoreB(e.target.value)}
                  className="text-center text-2xl h-14"
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Vencedor</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={winner === "yellow" ? "default" : "outline"}
                  onClick={() => setWinner("yellow")}
                >
                  🟡 Amarelo
                </Button>
                <Button
                  type="button"
                  variant={winner === "draw" ? "default" : "outline"}
                  onClick={() => setWinner("draw")}
                >
                  Empate
                </Button>
                <Button
                  type="button"
                  variant={winner === "blue" ? "default" : "outline"}
                  onClick={() => setWinner("blue")}
                >
                  🔵 Azul
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveResult}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TeamCard({
  color,
  ids,
  name,
}: {
  color: "yellow" | "blue";
  ids: string[];
  name: (id: string) => string;
}) {
  const bg =
    color === "yellow"
      ? "bg-[color:var(--team-yellow)] text-[color:var(--team-yellow-foreground)]"
      : "bg-[color:var(--team-blue)] text-[color:var(--team-blue-foreground)]";
  return (
    <div className={`rounded-lg p-3 ${bg}`}>
      <div className="font-bold mb-2 text-sm">{color === "yellow" ? "🟡 AMARELO" : "🔵 AZUL"}</div>
      <ul className="space-y-0.5 text-sm">
        {ids.map((id) => (
          <li key={id}>{name(id)}</li>
        ))}
      </ul>
    </div>
  );
}
