// Pure logic for team formation in a pelada.
// Follows rules:
// 1) Order of arrival (sequence)
// 2) Player currently OUT (didn't play last match)
// 3) Player with fewer games
// Winning team keeps colored bibs and stays on the field.

export type Winner = "yellow" | "blue" | "draw";

export interface MatchRecord {
  yellow_ids: string[];
  blue_ids: string[];
  winner: Winner | null;
}

export interface ArrivalEntry {
  player_id: string;
  active: boolean;
}

export const TEAM_SIZE = 6;

/**
 * Compute the number of games each active player has played so far.
 */
export function computeGameCounts(
  activePlayerIds: string[],
  matches: MatchRecord[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const id of activePlayerIds) counts.set(id, 0);
  for (const m of matches) {
    for (const id of m.yellow_ids) {
      if (counts.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    for (const id of m.blue_ids) {
      if (counts.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Order candidate players by the "next-to-play" rules:
 * 1. Fewer games first
 * 2. Wasn't on the last match (out) first
 * 3. Earlier arrival order first
 */
export function orderCandidates(
  candidates: string[],
  arrivalIndex: Map<string, number>,
  gameCounts: Map<string, number>,
  lastMatchPlayerIds: Set<string>,
): string[] {
  return [...candidates].sort((a, b) => {
    const ga = gameCounts.get(a) ?? 0;
    const gb = gameCounts.get(b) ?? 0;
    if (ga !== gb) return ga - gb;
    const aOut = lastMatchPlayerIds.has(a) ? 1 : 0;
    const bOut = lastMatchPlayerIds.has(b) ? 1 : 0;
    if (aOut !== bOut) return aOut - bOut; // out (0) first
    return (arrivalIndex.get(a) ?? 0) - (arrivalIndex.get(b) ?? 0);
  });
}

export interface FormationResult {
  yellow_ids: string[];
  blue_ids: string[];
  error?: string;
}

/**
 * Build the next match formation based on arrival order, active players
 * and past matches. `lastMatch` is the most recently finished match (with winner set).
 */
export function buildNextFormation(
  arrival: ArrivalEntry[],
  matches: MatchRecord[],
): FormationResult {
  const activeIds = arrival.filter((a) => a.active).map((a) => a.player_id);
  if (activeIds.length < TEAM_SIZE * 2) {
    return {
      yellow_ids: [],
      blue_ids: [],
      error: `São necessários pelo menos ${TEAM_SIZE * 2} jogadores ativos (você tem ${activeIds.length}).`,
    };
  }

  const arrivalIndex = new Map<string, number>();
  arrival.forEach((a, i) => arrivalIndex.set(a.player_id, i));

  const finishedMatches = matches.filter((m) => m.winner !== null);
  const gameCounts = computeGameCounts(activeIds, finishedMatches);
  const lastMatch = finishedMatches[finishedMatches.length - 1];

  // First match: first 6 yellow, next 6 blue (by arrival)
  if (!lastMatch) {
    const sorted = [...activeIds].sort(
      (a, b) => (arrivalIndex.get(a) ?? 0) - (arrivalIndex.get(b) ?? 0),
    );
    return {
      yellow_ids: sorted.slice(0, TEAM_SIZE),
      blue_ids: sorted.slice(TEAM_SIZE, TEAM_SIZE * 2),
    };
  }

  const lastPlayers = new Set<string>([...lastMatch.yellow_ids, ...lastMatch.blue_ids]);

  // Determine team that stays (if any)
  let stayColor: "yellow" | "blue" | null = null;
  let stayIds: string[] = [];
  if (lastMatch.winner === "yellow") {
    stayColor = "yellow";
    stayIds = lastMatch.yellow_ids.filter((id) => activeIds.includes(id));
  } else if (lastMatch.winner === "blue") {
    stayColor = "blue";
    stayIds = lastMatch.blue_ids.filter((id) => activeIds.includes(id));
  }

  // If the winning team lost players (checked out) and can't field 6, they leave too.
  if (stayColor && stayIds.length < TEAM_SIZE) {
    stayColor = null;
    stayIds = [];
  }

  const excluded = new Set<string>(stayIds);
  const candidates = activeIds.filter((id) => !excluded.has(id));

  // Pick next 6 by the rules
  const ordered = orderCandidates(candidates, arrivalIndex, gameCounts, lastPlayers);

  if (stayColor) {
    const nextTeam = ordered.slice(0, TEAM_SIZE);
    if (nextTeam.length < TEAM_SIZE) {
      return {
        yellow_ids: [],
        blue_ids: [],
        error: "Jogadores ativos insuficientes para formar o próximo time.",
      };
    }
    return stayColor === "yellow"
      ? { yellow_ids: stayIds, blue_ids: nextTeam }
      : { yellow_ids: nextTeam, blue_ids: stayIds };
  }

  // Draw or forced full swap: both teams new
  const yellow = ordered.slice(0, TEAM_SIZE);
  const blue = ordered.slice(TEAM_SIZE, TEAM_SIZE * 2);
  if (yellow.length < TEAM_SIZE || blue.length < TEAM_SIZE) {
    return {
      yellow_ids: [],
      blue_ids: [],
      error: "Jogadores ativos insuficientes para formar os dois times.",
    };
  }
  return { yellow_ids: yellow, blue_ids: blue };
}
