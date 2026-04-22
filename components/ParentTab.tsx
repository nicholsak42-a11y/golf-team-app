import { styles } from "@/lib/styles";
import { Player, PlayerStats } from "@/types/golf";

type ParentTabProps = {
  players: Player[];
  selectedPlayer: Player;
  selectedPlayerId: string;
  setSelectedPlayerId: (value: string) => void;
  selectedPlayerStats: PlayerStats | null;
};

export default function ParentTab({
  players,
  selectedPlayer,
  selectedPlayerId,
  setSelectedPlayerId,
  selectedPlayerStats,
}: ParentTabProps) {
  return (
    <section style={styles.section}>
      <div style={styles.card}>
        <h2>Parent View</h2>

        <label style={styles.field}>
          <span>Select Player</span>
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            style={styles.input}
          >
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        </label>

        <h3>{selectedPlayer.name}</h3>
        <div style={styles.infoGrid}>
          <p>Free Throw Club: {selectedPlayer.freeThrowClub}</p>
          <p>Rounds Logged: {selectedPlayerStats?.roundsLogged ?? 0}</p>
          <p>Average Score: {selectedPlayerStats?.averageScore ?? 0}</p>
          <p>Recent 3-Round Avg: {selectedPlayerStats?.recentAverageScore ?? 0}</p>
          <p>Best Round: {selectedPlayerStats?.bestRound ?? 0}</p>
          <p>Avg Penalties: {selectedPlayerStats?.averagePenalties ?? 0}</p>
          <p>Avg 3-Putts: {selectedPlayerStats?.averageThreePutts ?? 0}</p>
          <p>Avg Doubles: {selectedPlayerStats?.averageDoubles ?? 0}</p>
        </div>

        <p style={styles.focusText}>
          Trend: <strong>{selectedPlayerStats?.trend ?? "Not enough data"}</strong>
        </p>
        <p style={styles.focusText}>
          Focus This Week:{" "}
          <strong>{selectedPlayerStats?.focusArea ?? "No data yet"}</strong>
        </p>
      </div>

      <div style={styles.card}>
        <h3>Recent Rounds</h3>
        {selectedPlayer.rounds.length === 0 ? (
          <p>No rounds recorded yet.</p>
        ) : (
          selectedPlayer.rounds.slice(0, 5).map((round) => (
            <div key={round.id} style={styles.roundCard}>
              <div style={styles.infoGrid}>
                <p>Date: {round.date}</p>
                <p>Score: {round.score}</p>
                <p>Penalties: {round.penalties}</p>
                <p>3-Putts: {round.threePutts}</p>
                <p>Doubles: {round.doubles}</p>
              </div>
              <p>
                Notes:{" "}
                {round.notes && round.notes.trim().length > 0
                  ? round.notes
                  : "None"}
              </p>
            </div>
          ))
        )}
      </div>

      <div style={styles.card}>
        <h3>Yardage Summary</h3>
        {selectedPlayer.clubs.map((club, index) => (
          <p key={`${club.club}-${index}`}>
            {club.club}: {club.distance} yards
          </p>
        ))}
      </div>
    </section>
  );
}