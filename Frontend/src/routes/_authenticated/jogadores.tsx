import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/jogadores")({
  head: () => ({
    meta: [
      { title: "Jogadores — Pelada Hawai" },
      { name: "description", content: "Cadastro de jogadores da pelada." },
      { property: "og:title", content: "Jogadores — Pelada Hawai" },
      { property: "og:description", content: "Cadastro de jogadores da pelada." },
    ],
  }),
  component: JogadoresPage,
});

interface Player {
  id: string;
  name: string;
}

function JogadoresPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("players")
      .select("id, name")
      .order("name");
    if (error) return toast.error(error.message);
    setPlayers(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    const { error } = await supabase.from("players").insert({ name: trimmed });
    setLoading(false);
    if (error) return toast.error(error.message);
    setName("");
    toast.success("Jogador cadastrado");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este jogador?")) return;
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar jogador</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="flex gap-2">
            <Input
              placeholder="Nome do jogador"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
            <Button type="submit" disabled={loading}>
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jogadores ({players.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum jogador cadastrado ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {players.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <span>{p.name}</span>
                  <button
                    onClick={() => remove(p.id)}
                    className="text-destructive hover:opacity-80 p-2"
                    aria-label="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
