import { Club, Player, PlayerStats, Round } from "@/types/golf";
import { defaultClubs } from "@/lib/defaultClubs";

export function average(numbers: number[]) {
  if (numbers.length === 0) return 0;
  return Math.round(
    (numbers.reduce((total, value) => total + value, 0) / numbers.length) * 10
  ) / 10;
}

export function bestScore(rounds: Round[]) {
  if (rounds.length === 0) return 0;
  return Math.min(...rounds.map((round) => round.score));
}

export function recentAverage(rounds: Round[], count = 3) {
  if (rounds.length === 0) return 0;
  const recentRounds = rounds.slice(0, count);
  return average(recentRounds.map((round) => round.score));
}

export function sanitizeClubs(clubs: unknown): Club[] {
  if (!Array.isArray(clubs)) {
    return defaultClubs.map((club) => ({ ...club }));
  }

  const cleaned = clubs
    .map((club: any) => ({
      club: String(club?.club ?? "").trim(),
      distance: Number(club?.distance ?? 0),
    }))
    .filter((club) => club.club.length > 0);

  if (cleaned.length === 0) {
    return defaultClubs.map((club) => ({ ...club }));
  }

  return cleaned;
}

export function getScoreTrend(rounds: Round[]) {
  if (rounds.length < 4) return "Not enough data";

  const recent = rounds.slice(0, 3);
  const older = rounds.slice(3, 6);

  if (older.length === 0) return "Not enough data";

  const recentAvg = average(recent.map((round) => round.score));
  const olderAvg = average(older.map((round) => round.score));

  if (recentAvg < olderAvg) return "Improving";
  if (recentAvg > olderAvg) return "Trending Up";
  return "Steady";
}

export function getFocusArea(rounds: Round[]) {
  if (rounds.length === 0) return "No data yet";

  const avgPenalties = average(rounds.map((round) => round.penalties));
  const avgThreePutts = average(rounds.map((round) => round.threePutts));
  const avgDoubles = average(rounds.map((round) => round.doubles));

  const maxValue = Math.max(avgPenalties, avgThreePutts, avgDoubles);

  if (maxValue === avgPenalties) return "Course management";
  if (maxValue === avgThreePutts) return "Lag putting";
  return "Avoiding blow-up holes";
}

export function getPlayerStats(player: Player): PlayerStats {
  return {
    roundsLogged: player.rounds.length,
    averageScore: average(player.rounds.map((round) => round.score)),
    recentAverageScore: recentAverage(player.rounds, 3),
    bestRound: bestScore(player.rounds),
    averagePenalties: average(player.rounds.map((round) => round.penalties)),
    averageThreePutts: average(player.rounds.map((round) => round.threePutts)),
    averageDoubles: average(player.rounds.map((round) => round.doubles)),
    trend: getScoreTrend(player.rounds),
    focusArea: getFocusArea(player.rounds),
  };
}