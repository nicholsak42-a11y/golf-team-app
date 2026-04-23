import { styles } from "@/lib/styles";
import { Player, PlayerForm, PlayerStats, Round } from "@/types/golf";

type PlayerTabProps = {
  players: Player[];
  selectedPlayer: Player;
  selectedPlayerId: string;
  setSelectedPlayerId: (value: string) => void;
  playerForm: PlayerForm;
  setPlayerForm: React.Dispatch<React.SetStateAction<PlayerForm>>;
  roundDrafts: Record<string, Round>;
  addPlayer: () => Promise<void>;
  deletePlayer: () => Promise<void>;
  toggleArchivePlayer: () => Promise<void>;
  addClub: () => void;
  removeClub: (clubIndex: number) => void;
  updateLocalClubName: (clubIndex: number, value: string) => void;
  updateLocalClubDistance: (clubIndex: number, value: number) => void;
  savePlayer: () => Promise<void>;
  saveYardages: () => Promise<void>;
  addRound: () => Promise<void>;
  updateLocalRoundField: (
    roundId: string,
    field: keyof Round,
    value: string | number
  ) => void;
  saveRound: (roundId: string) => Promise<void>;
  deleteRound: (roundId: string) => Promise<void>;
  selectedPlayerStats: PlayerStats | null;
};

export default function PlayerTab({
  players,
  selectedPlayer,
  selectedPlayerId,
  setSelectedPlayerId,
  playerForm,
  setPlayerForm,
  roundDrafts,
  addPlayer,
  deletePlayer,
  toggleArchivePlayer,
  addClub,
  removeClub,
  updateLocalClubName,
  updateLocalClubDistance,
  savePlayer,
  saveYardages,
  addRound,
  updateLocalRoundField,
  saveRound,
  deleteRound,
  selectedPlayerStats,
}: PlayerTabProps) {
  return (
    <section style={styles.section}>
      <div style={styles.card}>
        <div style={styles.rowBetween}>
          <h2 style={{ margin: 0 }}>Player Tracker</h2>
          <button onClick={addPlayer} style={styles.button}>
            Add Player
          </button>
        </div>

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
                {player.archived ? " (Archived)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          <span>Player Name</span>
          <input
            value={playerForm.name}
            onChange={(e) =>
              setPlayerForm((prev) => ({ ...prev, name: e.target.value }))
            }
            style={styles.input}
          />
        </label>

        <label style={styles.field}>
          <span>Free Throw Club</span>
          <select
            value={playerForm.freeThrowClub}
            onChange={(e) =>
              setPlayerForm((prev) => ({
                ...prev,
                freeThrowClub: e.target.value,
              }))
            }
            style={styles.input}
          >
            {playerForm.clubs.length === 0 ? (
              <option value="">No clubs yet</option>
            ) : (
              playerForm.clubs.map((club, index) => (
                <option key={`${club.club}-${index}`} value={club.club}>
                  {club.club || `Club ${index + 1}`}
                </option>
              ))
            )}
          </select>
        </label>

        <label style={styles.field}>
          <span>Coach Notes</span>
          <textarea
            value={playerForm.coachNotes}
            onChange={(e) =>
              setPlayerForm((prev) => ({ ...prev, coachNotes: e.target.value }))
            }
            style={{ ...styles.input, minHeight: "110px", resize: "vertical" }}
          />
        </label>

        <div style={styles.fieldRow}>
          <button onClick={savePlayer} style={styles.button}>
            Save Player
          </button>

          <button onClick={toggleArchivePlayer} style={styles.secondaryButton}>
            {selectedPlayer.archived ? "Unarchive Player" : "Archive Player"}
          </button>

          <button onClick={deletePlayer} style={styles.deleteButton}>
            Delete Player
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.rowBetween}>
          <h3 style={{ margin: 0 }}>Yardages</h3>
          <div style={styles.fieldRow}>
            <button onClick={addClub} style={styles.secondaryButton}>
              Add Club
            </button>
            <button onClick={saveYardages} style={styles.button}>
              Save Yardages
            </button>
          </div>
        </div>

        {playerForm.clubs.map((club, clubIndex) => (
          <div key={clubIndex} style={styles.fieldRow}>
            <input
              value={club.club}
              onChange={(e) => updateLocalClubName(clubIndex, e.target.value)}
              placeholder="Club name"
              style={styles.input}
            />
            <input
              type="number"
              value={club.distance}
              onChange={(e) =>
                updateLocalClubDistance(clubIndex, Number(e.target.value))
              }
              style={styles.smallInput}
            />
            <span>yards</span>
            <button
              onClick={() => removeClub(clubIndex)}
              style={styles.secondaryButton}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.rowBetween}>
          <h3 style={{ margin: 0 }}>Round Tracker</h3>
          <button onClick={addRound} style={styles.button}>
            Add Round
          </button>
        </div>

        {selectedPlayer.rounds.length === 0 && <p>No rounds added yet.</p>}

        {selectedPlayer.rounds.map((round) => (
          <div key={round.id} style={styles.roundCard}>
            <label style={styles.field}>
              <span>Date</span>
              <input
                type="date"
                value={roundDrafts[round.id]?.date ?? round.date}
                onChange={(e) =>
                  updateLocalRoundField(round.id, "date", e.target.value)
                }
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              <span>Score</span>
              <input
                type="number"
                value={roundDrafts[round.id]?.score ?? round.score}
                onChange={(e) =>
                  updateLocalRoundField(
                    round.id,
                    "score",
                    Number(e.target.value)
                  )
                }
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              <span>Penalties</span>
              <input
                type="number"
                value={roundDrafts[round.id]?.penalties ?? round.penalties}
                onChange={(e) =>
                  updateLocalRoundField(
                    round.id,
                    "penalties",
                    Number(e.target.value)
                  )
                }
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              <span>3-Putts</span>
              <input
                type="number"
                value={roundDrafts[round.id]?.threePutts ?? round.threePutts}
                onChange={(e) =>
                  updateLocalRoundField(
                    round.id,
                    "threePutts",
                    Number(e.target.value)
                  )
                }
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              <span>Doubles or Worse</span>
              <input
                type="number"
                value={roundDrafts[round.id]?.doubles ?? round.doubles}
                onChange={(e) =>
                  updateLocalRoundField(
                    round.id,
                    "doubles",
                    Number(e.target.value)
                  )
                }
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              <span>Notes</span>
              <input
                value={roundDrafts[round.id]?.notes ?? round.notes}
                onChange={(e) =>
                  updateLocalRoundField(round.id, "notes", e.target.value)
                }
                style={styles.input}
              />
            </label>

            <div style={styles.fieldRow}>
              <button onClick={() => saveRound(round.id)} style={styles.button}>
                Save Round
              </button>

              <button
                onClick={() => deleteRound(round.id)}
                style={styles.deleteButton}
              >
                Delete Round
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <h3>Current Player Summary</h3>
        <p>Name: {selectedPlayer.name}</p>
        <p>Status: {selectedPlayer.archived ? "Archived" : "Active"}</p>
        <p>Free Throw Club: {selectedPlayer.freeThrowClub}</p>
        <p>Rounds Logged: {selectedPlayerStats?.roundsLogged ?? 0}</p>
        <p>Average Score: {selectedPlayerStats?.averageScore ?? 0}</p>
        <p>
          Recent 3-Round Average: {selectedPlayerStats?.recentAverageScore ?? 0}
        </p>
        <p>Best Round: {selectedPlayerStats?.bestRound ?? 0}</p>
        <p>Avg Penalties: {selectedPlayerStats?.averagePenalties ?? 0}</p>
        <p>Avg 3-Putts: {selectedPlayerStats?.averageThreePutts ?? 0}</p>
        <p>Avg Doubles or Worse: {selectedPlayerStats?.averageDoubles ?? 0}</p>
        <p>Trend: {selectedPlayerStats?.trend ?? "Not enough data"}</p>
        <p>Focus Area: {selectedPlayerStats?.focusArea ?? "No data yet"}</p>
      </div>
    </section>
  );
}