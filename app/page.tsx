"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Club = {
  club: string;
  distance: number;
};

type Round = {
  id: string;
  date: string;
  score: number;
  penalties: number;
  threePutts: number;
  doubles: number;
  notes: string;
};

type Player = {
  id: string;
  name: string;
  freeThrowClub: string;
  clubs: Club[];
  rounds: Round[];
};

type Tab = "philosophy" | "player" | "dashboard" | "parent";

function average(numbers: number[]) {
  if (numbers.length === 0) return 0;
  return Math.round(
    (numbers.reduce((a, b) => a + b, 0) / numbers.length) * 10
  ) / 10;
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("player");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [playerForm, setPlayerForm] = useState({
    name: "",
    freeThrowClub: "",
    clubs: [] as Club[],
  });

  const [roundDrafts, setRoundDrafts] = useState<Record<string, Round>>({});

  const loadPlayers = async () => {
    setLoading(true);
    setErrorMessage("");

    const { data: playersData, error: playersError } = await supabase
      .from("players")
      .select("*")
      .order("name");

    if (playersError) {
      setErrorMessage(`Load players failed: ${playersError.message}`);
      setLoading(false);
      return;
    }

    const { data: roundsData, error: roundsError } = await supabase
      .from("rounds")
      .select("*")
      .order("date", { ascending: false });

    if (roundsError) {
      setErrorMessage(`Load rounds failed: ${roundsError.message}`);
      setLoading(false);
      return;
    }

    const mappedPlayers: Player[] = (playersData || []).map((player: any) => ({
      id: String(player.id),
      name: player.name ?? "Player",
      freeThrowClub: player.free_throw_club ?? "PW",
      clubs: Array.isArray(player.clubs)
        ? player.clubs
        : [
            { club: "3 Wood", distance: 0 },
            { club: "Hybrid", distance: 0 },
            { club: "7 Iron", distance: 0 },
            { club: "PW", distance: 0 },
            { club: "SW", distance: 0 },
          ],
      rounds: (roundsData || [])
        .filter((round: any) => String(round.player_id) === String(player.id))
        .map((round: any) => ({
          id: String(round.id),
          date: round.date,
          score: round.score ?? 0,
          penalties: round.penalties ?? 0,
          threePutts: round.three_putts ?? 0,
          doubles: round.doubles ?? 0,
          notes: round.notes ?? "",
        })),
    }));

    setPlayers(mappedPlayers);
    setSelectedPlayerIndex((current) =>
      mappedPlayers.length === 0 ? 0 : Math.min(current, mappedPlayers.length - 1)
    );
    setLoading(false);
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const selectedPlayer = players[selectedPlayerIndex];

  useEffect(() => {
    if (!selectedPlayer) return;

    setPlayerForm({
      name: selectedPlayer.name,
      freeThrowClub: selectedPlayer.freeThrowClub,
      clubs: selectedPlayer.clubs,
    });

    const drafts: Record<string, Round> = {};
    selectedPlayer.rounds.forEach((round) => {
      drafts[round.id] = { ...round };
    });
    setRoundDrafts(drafts);
  }, [selectedPlayer]);

  const addPlayer = async () => {
    setErrorMessage("");

    const newPlayer = {
      name: `Player ${players.length + 1}`,
      free_throw_club: "PW",
      clubs: [
        { club: "3 Wood", distance: 0 },
        { club: "Hybrid", distance: 0 },
        { club: "7 Iron", distance: 0 },
        { club: "PW", distance: 0 },
        { club: "SW", distance: 0 },
      ],
    };

    const { error } = await supabase.from("players").insert(newPlayer);

    if (error) {
      setErrorMessage(`Add player failed: ${error.message}`);
      return;
    }

    await loadPlayers();
    setActiveTab("player");
  };

  const updateLocalClubDistance = (clubIndex: number, value: number) => {
    const updatedClubs = [...playerForm.clubs];
    updatedClubs[clubIndex] = {
      ...updatedClubs[clubIndex],
      distance: value,
    };

    setPlayerForm({
      ...playerForm,
      clubs: updatedClubs,
    });
  };

  const savePlayer = async () => {
    if (!selectedPlayer) return;

    setErrorMessage("");

    const { error } = await supabase
      .from("players")
      .update({
        name: playerForm.name,
        free_throw_club: playerForm.freeThrowClub,
        clubs: playerForm.clubs,
      })
      .eq("id", selectedPlayer.id);

    if (error) {
      setErrorMessage(`Save player failed: ${error.message}`);
      return;
    }

    await loadPlayers();
  };

  const addRound = async () => {
    if (!selectedPlayer) return;

    setErrorMessage("");

    const { error } = await supabase.from("rounds").insert({
      player_id: selectedPlayer.id,
      date: new Date().toISOString().slice(0, 10),
      score: 0,
      penalties: 0,
      three_putts: 0,
      doubles: 0,
      notes: "",
    });

    if (error) {
      setErrorMessage(`Add round failed: ${error.message}`);
      return;
    }

    await loadPlayers();
  };

  const updateLocalRoundField = (
    roundId: string,
    field: keyof Round,
    value: string | number
  ) => {
    setRoundDrafts((prev) => ({
      ...prev,
      [roundId]: {
        ...prev[roundId],
        [field]: value,
      },
    }));
  };

  const saveRound = async (roundId: string) => {
    const round = roundDrafts[roundId];
    if (!round) return;

    setErrorMessage("");

    const { error } = await supabase
      .from("rounds")
      .update({
        date: round.date,
        score: round.score,
        penalties: round.penalties,
        three_putts: round.threePutts,
        doubles: round.doubles,
        notes: round.notes,
      })
      .eq("id", roundId);

    if (error) {
      setErrorMessage(`Save round failed: ${error.message}`);
      return;
    }

    await loadPlayers();
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <h1>Golf Team App</h1>
        <p>Loading shared data...</p>
        {errorMessage ? <p style={styles.error}>{errorMessage}</p> : null}
      </main>
    );
  }

  if (!selectedPlayer && players.length === 0) {
    return (
      <main style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>Golf Team App</h1>
          <p style={styles.heroText}>No players yet. Add your first player.</p>
        </div>

        {errorMessage ? <p style={styles.error}>{errorMessage}</p> : null}

        <button onClick={addPlayer} style={styles.button}>
          Add First Player
        </button>

        <button onClick={loadPlayers} style={{ ...styles.button, marginTop: 12 }}>
          Retry Load
        </button>
      </main>
    );
  }

  if (!selectedPlayer) {
    return (
      <main style={styles.page}>
        <h1>Golf Team App</h1>
        {errorMessage ? <p style={styles.error}>{errorMessage}</p> : null}
        <p>No player selected.</p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Golf Team App</h1>
        <p style={styles.heroText}>
          Simple, repeatable scoring for players, coach, and parents.
        </p>
      </div>

      {errorMessage ? <p style={styles.error}>{errorMessage}</p> : null}

      <div style={styles.tabBar}>
        <button
          style={activeTab === "philosophy" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("philosophy")}
        >
          Philosophy
        </button>
        <button
          style={activeTab === "player" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("player")}
        >
          Player
        </button>
        <button
          style={activeTab === "dashboard" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          style={activeTab === "parent" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("parent")}
        >
          Parent
        </button>
      </div>

      {activeTab === "philosophy" && (
        <section style={styles.section}>
          <div style={styles.card}>
            <h2>Team Philosophy</h2>
            <p>We are not chasing perfect golf. We are trying to avoid big numbers.</p>
            <p>Double bogey is success. Bogey is a bonus.</p>
          </div>

          <div style={styles.card}>
            <h3>Shot Budget</h3>
            <p>Par 3: 2 shots to get near the green, then 1 chip and 2 putts.</p>
            <p>Par 4: 3 shots to get near the green, then 1 chip and 2 putts.</p>
            <p>Par 5: 4 shots to get near the green, then 1 chip and 2 putts.</p>
          </div>

          <div style={styles.card}>
            <h3>Short Game Identity</h3>
            <p>We are a chip-and-run team.</p>
            <p>Land the ball on the green and let it roll like a putt.</p>
            <p>One chip, then 2 putts.</p>
          </div>

          <div style={styles.card}>
            <h3>What We Track</h3>
            <p>Scores, penalties, 3-putts, doubles or worse, and notes.</p>
          </div>
        </section>
      )}

      {activeTab === "player" && (
        <section style={styles.section}>
          <div style={styles.card}>
            <div style={styles.rowBetween}>
              <h2 style={{ margin: 0 }}>Player Tracker</h2>
              <button onClick={addPlayer} style={styles.button}>
                Add Player
              </button>
            </div>

            <div style={styles.field}>
              <label>Select Player</label>
              <select
                value={selectedPlayerIndex}
                onChange={(e) => setSelectedPlayerIndex(Number(e.target.value))}
                style={styles.input}
              >
                {players.map((player, index) => (
                  <option key={player.id} value={index}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label>Player Name</label>
              <input
                type="text"
                value={playerForm.name}
                onChange={(e) =>
                  setPlayerForm({ ...playerForm, name: e.target.value })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label>Free Throw Club</label>
              <input
                type="text"
                value={playerForm.freeThrowClub}
                onChange={(e) =>
                  setPlayerForm({ ...playerForm, freeThrowClub: e.target.value })
                }
                style={styles.input}
              />
            </div>

            <button onClick={savePlayer} style={styles.button}>
              Save Player
            </button>
          </div>

          <div style={styles.card}>
            <h3>Yardages</h3>
            {playerForm.clubs.map((club, clubIndex) => (
              <div key={club.club} style={styles.fieldRow}>
                <label style={styles.clubLabel}>{club.club}</label>
                <input
                  type="number"
                  value={playerForm.clubs[clubIndex]?.distance ?? 0}
                  onChange={(e) =>
                    updateLocalClubDistance(clubIndex, Number(e.target.value))
                  }
                  style={styles.smallInput}
                />
                <span>yards</span>
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
                <div style={styles.field}>
                  <label>Date</label>
                  <input
                    type="date"
                    value={roundDrafts[round.id]?.date ?? round.date}
                    onChange={(e) =>
                      updateLocalRoundField(round.id, "date", e.target.value)
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label>Score</label>
                  <input
                    type="number"
                    value={roundDrafts[round.id]?.score ?? round.score}
                    onChange={(e) =>
                      updateLocalRoundField(round.id, "score", Number(e.target.value))
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label>Penalties</label>
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
                </div>

                <div style={styles.field}>
                  <label>3-Putts</label>
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
                </div>

                <div style={styles.field}>
                  <label>Doubles or Worse</label>
                  <input
                    type="number"
                    value={roundDrafts[round.id]?.doubles ?? round.doubles}
                    onChange={(e) =>
                      updateLocalRoundField(round.id, "doubles", Number(e.target.value))
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label>Notes</label>
                  <input
                    type="text"
                    value={roundDrafts[round.id]?.notes ?? round.notes}
                    onChange={(e) =>
                      updateLocalRoundField(round.id, "notes", e.target.value)
                    }
                    style={styles.input}
                  />
                </div>

                <button onClick={() => saveRound(round.id)} style={styles.button}>
                  Save Round
                </button>
              </div>
            ))}
          </div>

          <div style={styles.card}>
            <h3>Current Player Summary</h3>
            <p><strong>Name:</strong> {selectedPlayer.name}</p>
            <p><strong>Free Throw Club:</strong> {selectedPlayer.freeThrowClub}</p>
            <p><strong>Rounds Logged:</strong> {selectedPlayer.rounds.length}</p>
            <p><strong>Average Score:</strong> {average(selectedPlayer.rounds.map((r) => r.score))}</p>
            <p><strong>Avg Penalties:</strong> {average(selectedPlayer.rounds.map((r) => r.penalties))}</p>
            <p><strong>Avg 3-Putts:</strong> {average(selectedPlayer.rounds.map((r) => r.threePutts))}</p>
          </div>
        </section>
      )}

      {activeTab === "dashboard" && (
        <section style={styles.section}>
          <div style={styles.card}>
            <h2>Team Dashboard</h2>
            <p><strong>Players:</strong> {players.length}</p>
          </div>

          {players.map((player) => (
            <div key={player.id} style={styles.card}>
              <h3>{player.name}</h3>
              <p><strong>Free Throw Club:</strong> {player.freeThrowClub}</p>
              <p><strong>Avg Score:</strong> {average(player.rounds.map((r) => r.score))}</p>
              <p><strong>Avg Penalties:</strong> {average(player.rounds.map((r) => r.penalties))}</p>
              <p><strong>Avg 3-Putts:</strong> {average(player.rounds.map((r) => r.threePutts))}</p>
              <p><strong>Rounds Logged:</strong> {player.rounds.length}</p>
            </div>
          ))}
        </section>
      )}

      {activeTab === "parent" && (
        <section style={styles.section}>
          <div style={styles.card}>
            <h2>Parent View</h2>

            <div style={styles.field}>
              <label>Select Player</label>
              <select
                value={selectedPlayerIndex}
                onChange={(e) => setSelectedPlayerIndex(Number(e.target.value))}
                style={styles.input}
              >
                {players.map((player, index) => (
                  <option key={player.id} value={index}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.card}>
            <h3>{selectedPlayer.name}</h3>
            <p><strong>Free Throw Club:</strong> {selectedPlayer.freeThrowClub}</p>
            <p><strong>Rounds Logged:</strong> {selectedPlayer.rounds.length}</p>
            <p><strong>Average Score:</strong> {average(selectedPlayer.rounds.map((r) => r.score))}</p>
            <p><strong>Avg Penalties:</strong> {average(selectedPlayer.rounds.map((r) => r.penalties))}</p>
            <p><strong>Avg 3-Putts:</strong> {average(selectedPlayer.rounds.map((r) => r.threePutts))}</p>
          </div>

          <div style={styles.card}>
            <h3>Yardage Summary</h3>
            {selectedPlayer.clubs.map((club) => (
              <p key={club.club}>
                <strong>{club.club}:</strong> {club.distance} yards
              </p>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: "16px",
    fontFamily: "Arial, sans-serif",
    maxWidth: "900px",
    margin: "0 auto",
    backgroundColor: "#f4f7f5",
    minHeight: "100vh",
    color: "black",
  },
  hero: {
    backgroundColor: "#1f6b43",
    color: "white",
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "16px",
  },
  heroTitle: {
    margin: 0,
    fontSize: "28px",
  },
  heroText: {
    marginTop: "8px",
    marginBottom: 0,
    lineHeight: 1.5,
  },
  error: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "16px",
    fontWeight: 600,
  },
  tabBar: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
    marginBottom: "16px",
  },
  tab: {
    padding: "12px 8px",
    borderRadius: "10px",
    border: "1px solid #cfd8d3",
    backgroundColor: "white",
    color: "black",
    cursor: "pointer",
    fontWeight: 600,
  },
  activeTab: {
    padding: "12px 8px",
    borderRadius: "10px",
    border: "1px solid #1f6b43",
    backgroundColor: "#1f6b43",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  card: {
    backgroundColor: "white",
    color: "black",
    borderRadius: "14px",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "12px",
  },
  fieldRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
    flexWrap: "wrap",
  },
  rowBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #cfd8d3",
    fontSize: "16px",
    color: "black",
    backgroundColor: "white",
  },
  smallInput: {
    width: "90px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #cfd8d3",
    fontSize: "16px",
    color: "black",
    backgroundColor: "white",
  },
  clubLabel: {
    minWidth: "90px",
    fontWeight: 600,
  },
  button: {
    backgroundColor: "#1f6b43",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  roundCard: {
    border: "1px solid #d9e2dd",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "12px",
    backgroundColor: "#fafcfa",
  },
};