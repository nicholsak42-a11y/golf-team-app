import { styles } from "@/lib/styles";
import { Player, PlayerStats } from "@/types/golf";

type DashboardEntry = {
  player: Player;
  stats: PlayerStats;
};

type ImprovedEntry = DashboardEntry & {
  improvement: number;
};

type DashboardTabProps = {
  players: Player[];
  totalRounds: number;
  teamAverageScore: number;
  bestAveragePlayer: DashboardEntry | null;
  highestPenaltyPlayer: DashboardEntry | null;
  highestThreePuttPlayer: DashboardEntry | null;
  mostImprovedPlayer: ImprovedEntry | null;
  dashboardPlayers: DashboardEntry[];
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
}: DashboardTabProps) {
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
        <h2>Team Dashboard</h2>
        <p style={styles.mutedText}>
          Players are sorted by lowest average score first.
        </p>

        {dashboardPlayers.map(({ player, stats }) => (
          <div key={player.id} style={styles.roundCard}>
            <div style={styles.rowBetween}>
              <h3 style={{ margin: 0 }}>{player.name}</h3>
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
        ))}
      </div>
    </section>
  );
}