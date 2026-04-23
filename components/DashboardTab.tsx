"use client";

import { useMemo, useState } from "react";
import { styles } from "@/lib/styles";
import { Player, PlayerStats } from "@/types/golf";

type DashboardEntry = {
  player: Player;
  stats: PlayerStats;
};

type ImprovedEntry = DashboardEntry & {
  improvement: number;
};

type SortKey =
  | "averageScore"
  | "recentAverageScore"
  | "bestRound"
  | "averagePenalties"
  | "averageThreePutts"
  | "averageDoubles"
  | "roundsLogged"
  | "name";

type DashboardTabProps = {
  players: Player[];
  totalRounds: number;
  teamAverageScore: number;
  bestAveragePlayer: DashboardEntry | null;
  highestPenaltyPlayer: DashboardEntry | null;
  highestThreePuttPlayer: DashboardEntry | null;
  mostImprovedPlayer: ImprovedEntry | null;
  dashboardPlayers: DashboardEntry[];
  showArchivedPlayers: boolean;
};

export default function DashboardTab({
  players,
  totalRounds,
  teamAverageScore,
  bestAveragePlayer,
  highestPenaltyPlayer,
  highestThreePuttPlayer,
  mostImprovedPlayer,
  dashboardPlayers,
  showArchivedPlayers,
}: DashboardTabProps) {
  const [sortKey, setSortKey] = useState<SortKey>("averageScore");
  const [sortAscending, setSortAscending] = useState(true);
  const [hidePlayersWithNoRounds, setHidePlayersWithNoRounds] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");

  const filteredAndSortedPlayers = useMemo(() => {
    let result = [...dashboardPlayers];

    const query = playerSearch.trim().toLowerCase();
    if (query) {
      result = result.filter((entry) =>
        entry.player.name.toLowerCase().includes(query)
      );
    }

    if (hidePlayersWithNoRounds) {
      result = result.filter((entry) => entry.stats.roundsLogged > 0);
    }

    result.sort((a, b) => {
      if (sortKey === "name") {
        const nameCompare = a.player.name.localeCompare(b.player.name);
        return sortAscending ? nameCompare : -nameCompare;
      }

      const aValue = a.stats[sortKey];
      const bValue = b.stats[sortKey];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortAscending ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return result;
  }, [
    dashboardPlayers,
    hidePlayersWithNoRounds,
    sortAscending,
    sortKey,
    playerSearch,
  ]);

  return (
    <section style={styles.section}>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Players</div>
          <div style={styles.statValue}>{players.length}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Rounds</div>
          <div style={styles.statValue}>{totalRounds}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Team Avg Score</div>
          <div style={styles.statValue}>{teamAverageScore}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Best Avg Score</div>
          <div style={styles.statValue}>
            {bestAveragePlayer
              ? `${bestAveragePlayer.player.name} (${bestAveragePlayer.stats.averageScore})`
              : "No data"}
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Highest Penalties</div>
          <div style={styles.statValue}>
            {highestPenaltyPlayer
              ? `${highestPenaltyPlayer.player.name} (${highestPenaltyPlayer.stats.averagePenalties})`
              : "No data"}
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Highest 3-Putts</div>
          <div style={styles.statValue}>
            {highestThreePuttPlayer
              ? `${highestThreePuttPlayer.player.name} (${highestThreePuttPlayer.stats.averageThreePutts})`
              : "No data"}
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Most Improved</div>
          <div style={styles.statValue}>
            {mostImprovedPlayer
              ? `${mostImprovedPlayer.player.name} (+${
                  Math.round(mostImprovedPlayer.improvement * 10) / 10
                })`
              : "Not enough data"}
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.rowBetween}>
          <div>
            <h2 style={{ margin: 0 }}>Team Dashboard</h2>
            <p style={styles.mutedText}>
              {showArchivedPlayers
                ? "Showing active and archived players."
                : "Showing active players only."}
            </p>
          </div>
        </div>

        <label style={styles.field}>
          <span>Search Player</span>
          <input
            value={playerSearch}
            onChange={(e) => setPlayerSearch(e.target.value)}
            placeholder="Type a player name..."
            style={styles.input}
          />
        </label>

        <div style={styles.infoGrid}>
          <label style={styles.field}>
            <span>Sort By</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              style={styles.input}
            >
              <option value="averageScore">Average Score</option>
              <option value="recentAverageScore">Recent 3-Round Average</option>
              <option value="bestRound">Best Round</option>
              <option value="averagePenalties">Average Penalties</option>
              <option value="averageThreePutts">Average 3-Putts</option>
              <option value="averageDoubles">Average Doubles</option>
              <option value="roundsLogged">Rounds Logged</option>
              <option value="name">Name</option>
            </select>
          </label>

          <label style={styles.field}>
            <span>Direction</span>
            <select
              value={sortAscending ? "asc" : "desc"}
              onChange={(e) => setSortAscending(e.target.value === "asc")}
              style={styles.input}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </div>

        <div style={styles.fieldRow}>
          <label style={styles.fieldRow}>
            <input
              type="checkbox"
              checked={hidePlayersWithNoRounds}
              onChange={(e) => setHidePlayersWithNoRounds(e.target.checked)}
            />
            <span>Hide players with no rounds</span>
          </label>
        </div>

        {filteredAndSortedPlayers.length === 0 ? (
          <p>No players match the current dashboard filters.</p>
        ) : (
          filteredAndSortedPlayers.map(({ player, stats }) => (
            <div key={player.id} style={styles.roundCard}>
              <div style={styles.rowBetween}>
                <div style={styles.fieldRow}>
                  <h3 style={{ margin: 0 }}>{player.name}</h3>
                  {player.archived ? (
                    <span style={styles.archivedBadge}>Archived</span>
                  ) : null}
                </div>
                <span style={styles.badge}>{stats.trend}</span>
              </div>

              <div style={styles.infoGrid}>
                <p>Rounds Logged: {stats.roundsLogged}</p>
                <p>Free Throw Club: {player.freeThrowClub}</p>
                <p>Average Score: {stats.averageScore}</p>
                <p>Recent 3-Round Avg: {stats.recentAverageScore}</p>
                <p>Best Round: {stats.bestRound}</p>
                <p>Avg Penalties: {stats.averagePenalties}</p>
                <p>Avg 3-Putts: {stats.averageThreePutts}</p>
                <p>Avg Doubles: {stats.averageDoubles}</p>
              </div>

              <p style={styles.focusText}>
                Focus Area: <strong>{stats.focusArea}</strong>
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}