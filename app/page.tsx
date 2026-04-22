"use client";

import { useEffect, useMemo, useState } from "react";
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

const defaultClubs: Club[] = [
  { club: "Driver", distance: 0 },
  { club: "3 Wood", distance: 0 },
  { club: "5 Wood", distance: 0 },
  { club: "4 Hybrid", distance: 0 },
  { club: "5 Iron", distance: 0 },
  { club: "6 Iron", distance: 0 },
  { club: "7 Iron", distance: 0 },
  { club: "8 Iron", distance: 0 },
  { club: "9 Iron", distance: 0 },
  { club: "PW", distance: 0 },
  { club: "GW", distance: 0 },
  { club: "SW", distance: 0 },
  { club: "LW", distance: 0 },
];

function average(numbers: number[]) {
  if (numbers.length === 0) return 0;
  return Math.round(
    (numbers.reduce((total, value) => total + value, 0) / numbers.length) * 10
  ) / 10;
}

function bestScore(rounds: Round[]) {
  if (rounds.length === 0) return 0;
  return Math.min(...rounds.map((round) => round.score));
}

function recentAverage(rounds: Round[], count = 3) {
  if (rounds.length === 0) return 0;
  const recentRounds = rounds.slice(0, count);
  return average(recentRounds.map((round) => round.score));
}

function sanitizeClubs(clubs: unknown): Club[] {
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

function getScoreTrend(rounds: Round[]) {
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

function getFocusArea(rounds: Round[]) {
  if (rounds.length === 0) return "No data yet";

  const avgPenalties = average(rounds.map((round) => round.penalties));
  const avgThreePutts = average(rounds.map((round) => round.threePutts));
  const avgDoubles = average(rounds.map((round) => round.doubles));

  const maxValue = Math.max(avgPenalties, avgThreePutts, avgDoubles);

  if (maxValue === avgPenalties) return "Course management";
  if (maxValue === avgThreePutts) return "Lag putting";
  return "Avoiding blow-up holes";
}

function getPlayerStats(player: Player) {
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

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<Tab>("player");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [playerForm, setPlayerForm] = useState<{
    name: string;
    freeThrowClub: string;
    clubs: Club[];
  }>({
    name: "",
    freeThrowClub: "",
    clubs: [],
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

    const mappedPlayers: Player[] = (playersData || []).map((player: any) => {
      const clubs = sanitizeClubs(player.clubs);
      const freeThrowClub =
        typeof player.free_throw_club === "string" && player.free_throw_club
          ? player.free_throw_club
          : clubs[0]?.club ?? "PW";

      return {
        id: String(player.id),
        name: player.name ?? "Player",
        freeThrowClub,
        clubs,
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
      };
    });

    setPlayers(mappedPlayers);

    setSelectedPlayerId((current) => {
      if (mappedPlayers.length === 0) return "";
      const stillExists = mappedPlayers.some((player) => player.id === current);
      return stillExists ? current : mappedPlayers[0].id;
    });

    setLoading(false);
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const selectedPlayer =
    players.find((player) => player.id === selectedPlayerId) ?? players[0] ?? null;

  useEffect(() => {
    if (!selectedPlayer) return;

    if (selectedPlayerId !== selectedPlayer.id) {
      setSelectedPlayerId(selectedPlayer.id);
    }

    setPlayerForm({
      name: selectedPlayer.name,
      freeThrowClub:
        selectedPlayer.freeThrowClub || selectedPlayer.clubs[0]?.club || "",
      clubs: selectedPlayer.clubs.map((club) => ({ ...club })),
    });

    const drafts: Record<string, Round> = {};
    selectedPlayer.rounds.forEach((round) => {
      drafts[round.id] = { ...round };
    });
    setRoundDrafts(drafts);
  }, [selectedPlayer, selectedPlayerId]);

  const selectedPlayerStats = selectedPlayer
    ? getPlayerStats(selectedPlayer)
    : null;

  const dashboardPlayers = useMemo(() => {
    return [...players]
      .map((player) => ({
        player,
        stats: getPlayerStats(player),
      }))
      .sort((a, b) => {
        if (a.stats.roundsLogged === 0 && b.stats.roundsLogged === 0) return 0;
        if (a.stats.roundsLogged === 0) return 1;
        if (b.stats.roundsLogged === 0) return -1;
        return a.stats.averageScore - b.stats.averageScore;
      });
  }, [players]);

  const totalRounds = players.reduce(
    (total, player) => total + player.rounds.length,
    0
  );

  const playersWithRounds = dashboardPlayers.filter(
    (entry) => entry.stats.roundsLogged > 0
  );

  const teamAverageScore =
    playersWithRounds.length > 0
      ? average(playersWithRounds.map((entry) => entry.stats.averageScore))
      : 0;

  const bestAveragePlayer =
    playersWithRounds.length > 0
      ? [...playersWithRounds].sort(
          (a, b) => a.stats.averageScore - b.stats.averageScore
        )[0]
      : null;

  const highestPenaltyPlayer =
    playersWithRounds.length > 0
      ? [...playersWithRounds].sort(
          (a, b) => b.stats.averagePenalties - a.stats.averagePenalties
        )[0]
      : null;

  const highestThreePuttPlayer =
    playersWithRounds.length > 0
      ? [...playersWithRounds].sort(
          (a, b) => b.stats.averageThreePutts - a.stats.averageThreePutts
        )[0]
      : null;

  const mostImprovedPlayer =
    playersWithRounds.length > 0
      ? [...playersWithRounds]
          .map((entry) => {
            const recent = average(
              entry.player.rounds.slice(0, 3).map((round) => round.score)
            );
            const older = average(
              entry.player.rounds.slice(3, 6).map((round) => round.score)
            );
            const improvement =
              entry.player.rounds.length >= 4 ? older - recent : -999;
            return {
              ...entry,
              improvement,
            };
          })
          .filter((entry) => entry.improvement > -999)
          .sort((a, b) => b.improvement - a.improvement)[0] ?? null
      : null;

  const addPlayer = async () => {
    setErrorMessage("");

    const starterClubs = defaultClubs.map((club) => ({ ...club }));

    const newPlayer = {
      name: `Player ${players.length + 1}`,
      free_throw_club: starterClubs[0]?.club ?? "PW",
      clubs: starterClubs,
    };

    const { data, error } = await supabase
      .from("players")
      .insert(newPlayer)
      .select("id")
      .single();

    if (error) {
      setErrorMessage(`Add player failed: ${error.message}`);
      return;
    }

    if (data?.id) {
      setSelectedPlayerId(String(data.id));
    }

    await loadPlayers();
    setActiveTab("player");
  };

  const updateLocalClubDistance = (clubIndex: number, value: number) => {
    const updatedClubs = [...playerForm.clubs];
    updatedClubs[clubIndex] = {
      ...updatedClubs[clubIndex],
      distance: Number.isNaN(value) ? 0 : value,
    };

    setPlayerForm({
      ...playerForm,
      clubs: updatedClubs,
    });
  };

  const updateLocalClubName = (clubIndex: number, value: string) => {
    const updatedClubs = [...playerForm.clubs];
    const oldName = updatedClubs[clubIndex]?.club ?? "";

    updatedClubs[clubIndex] = {
      ...updatedClubs[clubIndex],
      club: value,
    };

    setPlayerForm((prev) => ({
      ...prev,
      clubs: updatedClubs,
      freeThrowClub:
        prev.freeThrowClub === oldName ? value : prev.freeThrowClub,
    }));
  };

  const addClub = () => {
    setPlayerForm((prev) => ({
      ...prev,
      clubs: [...prev.clubs, { club: "", distance: 0 }],
    }));
  };

  const removeClub = (clubIndex: number) => {
    setPlayerForm((prev) => {
      const clubToRemove = prev.clubs[clubIndex];
      const updatedClubs = prev.clubs.filter((_, index) => index !== clubIndex);

      const nextFreeThrowClub =
        prev.freeThrowClub === clubToRemove?.club
          ? updatedClubs[0]?.club ?? ""
          : prev.freeThrowClub;

      return {
        ...prev,
        clubs: updatedClubs,
        freeThrowClub: nextFreeThrowClub,
      };
    });
  };

  const savePlayer = async () => {
    if (!selectedPlayer) return;
    setErrorMessage("");

    const clubsToSave = sanitizeClubs(playerForm.clubs);
    const freeThrowClub =
      playerForm.freeThrowClub || clubsToSave[0]?.club || "PW";

    const { error } = await supabase
      .from("players")
      .update({
        name: playerForm.name,
        free_throw_club: freeThrowClub,
        clubs: clubsToSave,
      })
      .eq("id", selectedPlayer.id);

    if (error) {
      setErrorMessage(`Save player failed: ${error.message}`);
      return;
    }

    await loadPlayers();
  };

  const saveYardages = async () => {
    if (!selectedPlayer) return;
    setErrorMessage("");

    const clubsToSave = sanitizeClubs(playerForm.clubs);
    const freeThrowClub =
      playerForm.freeThrowClub || clubsToSave[0]?.club || "PW";

    const { error } = await supabase
      .from("players")
      .update({
        clubs: clubsToSave,
        free_throw_club: freeThrowClub,
      })
      .eq("id", selectedPlayer.id);

    if (error) {
      setErrorMessage(`Save yardages failed: ${error.message}`);
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

  const deleteRound = async (roundId: string) => {
    const confirmed = window.confirm("Delete this round?");
    if (!confirmed) return;

    setErrorMessage("");

    const { error } = await supabase.from("rounds").delete().eq("id", roundId);

    if (error) {
      setErrorMessage(`Delete round failed: ${error.message}`);
      return;
    }

    await loadPlayers();
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>Golf Team App</h1>
          <p style={styles.heroText}>Loading shared data...</p>
        </div>
        {errorMessage ? <div style={styles.error}>{errorMessage}</div> : null}
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

        {errorMessage ? <div style={styles.error}>{errorMessage}</div> : null}

        <div style={styles.rowBetween}>
          <button onClick={addPlayer} style={styles.button}>
            Add First Player
          </button>
          <button onClick={loadPlayers} style={styles.secondaryButton}>
            Retry Load
          </button>
        </div>
      </main>
    );
  }

  if (!selectedPlayer) {
    return (
      <main style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>Golf Team App</h1>
        </div>
        {errorMessage ? <div style={styles.error}>{errorMessage}</div> : null}
        <div style={styles.card}>
          <p>No player selected.</p>
        </div>
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

      {errorMessage ? <div style={styles.error}>{errorMessage}</div> : null}

      <div style={styles.tabBar}>
        <button
          onClick={() => setActiveTab("philosophy")}
          style={activeTab === "philosophy" ? styles.activeTab : styles.tab}
        >
          Philosophy
        </button>
        <button
          onClick={() => setActiveTab("player")}
          style={activeTab === "player" ? styles.activeTab : styles.tab}
        >
          Player
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          style={activeTab === "dashboard" ? styles.activeTab : styles.tab}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("parent")}
          style={activeTab === "parent" ? styles.activeTab : styles.tab}
        >
          Parent
        </button>
      </div>

      {activeTab === "philosophy" && (
        <section style={styles.section}>
          <div style={styles.card}>
            <h2>Team Philosophy</h2>
            <p>
              We are not chasing perfect golf. We are trying to avoid big
              numbers.
            </p>
            <p>Double bogey is success. Bogey is a bonus.</p>

            <h3>Shot Budget</h3>
            <p>Par 3: 2 shots to get near the green, then 1 chip and 2 putts.</p>
            <p>Par 4: 3 shots to get near the green, then 1 chip and 2 putts.</p>
            <p>Par 5: 4 shots to get near the green, then 1 chip and 2 putts.</p>

            <h3>Short Game Identity</h3>
            <p>We are a chip-and-run team.</p>
            <p>Land the ball on the green and let it roll like a putt.</p>
            <p>One chip, then 2 putts.</p>

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

            <label style={styles.field}>
              <span>Select Player</span>
              <select
                value={selectedPlayer.id}
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

            <label style={styles.field}>
              <span>Player Name</span>
              <input
                value={playerForm.name}
                onChange={(e) =>
                  setPlayerForm({ ...playerForm, name: e.target.value })
                }
                style={styles.input}
              />
            </label>

            <label style={styles.field}>
              <span>Free Throw Club</span>
              <select
                value={playerForm.freeThrowClub}
                onChange={(e) =>
                  setPlayerForm({
                    ...playerForm,
                    freeThrowClub: e.target.value,
                  })
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

            <button onClick={savePlayer} style={styles.button}>
              Save Player
            </button>
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
                  onChange={(e) =>
                    updateLocalClubName(clubIndex, e.target.value)
                  }
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
                    value={
                      roundDrafts[round.id]?.threePutts ?? round.threePutts
                    }
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
                  <button
                    onClick={() => saveRound(round.id)}
                    style={styles.button}
                  >
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
            <p>Free Throw Club: {selectedPlayer.freeThrowClub}</p>
            <p>Rounds Logged: {selectedPlayerStats?.roundsLogged ?? 0}</p>
            <p>Average Score: {selectedPlayerStats?.averageScore ?? 0}</p>
            <p>
              Recent 3-Round Average:{" "}
              {selectedPlayerStats?.recentAverageScore ?? 0}
            </p>
            <p>Best Round: {selectedPlayerStats?.bestRound ?? 0}</p>
            <p>Avg Penalties: {selectedPlayerStats?.averagePenalties ?? 0}</p>
            <p>Avg 3-Putts: {selectedPlayerStats?.averageThreePutts ?? 0}</p>
            <p>Avg Doubles or Worse: {selectedPlayerStats?.averageDoubles ?? 0}</p>
            <p>Trend: {selectedPlayerStats?.trend ?? "Not enough data"}</p>
            <p>Focus Area: {selectedPlayerStats?.focusArea ?? "No data yet"}</p>
          </div>
        </section>
      )}

      {activeTab === "dashboard" && (
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
                  ? `${mostImprovedPlayer.player.name} (+${Math.round(
                      mostImprovedPlayer.improvement * 10
                    ) / 10})`
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
      )}

      {activeTab === "parent" && (
        <section style={styles.section}>
          <div style={styles.card}>
            <h2>Parent View</h2>

            <label style={styles.field}>
              <span>Select Player</span>
              <select
                value={selectedPlayer.id}
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
              <p>
                Recent 3-Round Avg:{" "}
                {selectedPlayerStats?.recentAverageScore ?? 0}
              </p>
              <p>Best Round: {selectedPlayerStats?.bestRound ?? 0}</p>
              <p>Avg Penalties: {selectedPlayerStats?.averagePenalties ?? 0}</p>
              <p>Avg 3-Putts: {selectedPlayerStats?.averageThreePutts ?? 0}</p>
              <p>Avg Doubles: {selectedPlayerStats?.averageDoubles ?? 0}</p>
            </div>

            <p style={styles.focusText}>
              Trend:{" "}
              <strong>{selectedPlayerStats?.trend ?? "Not enough data"}</strong>
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
      )}
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: "16px",
    fontFamily: "Arial, sans-serif",
    maxWidth: "1000px",
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  statCard: {
    backgroundColor: "white",
    color: "black",
    borderRadius: "14px",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #d9e2dd",
  },
  statLabel: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#4b6355",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  statValue: {
    fontSize: "18px",
    fontWeight: 700,
    lineHeight: 1.4,
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
    minWidth: "180px",
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
  button: {
    backgroundColor: "#1f6b43",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryButton: {
    backgroundColor: "white",
    color: "#1f6b43",
    border: "1px solid #1f6b43",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  deleteButton: {
    backgroundColor: "#b91c1c",
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
  badge: {
    backgroundColor: "#e7f3eb",
    color: "#1f6b43",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "8px 16px",
  },
  focusText: {
    marginTop: "10px",
    marginBottom: 0,
  },
  mutedText: {
    color: "#4b6355",
    marginTop: 0,
  },
};