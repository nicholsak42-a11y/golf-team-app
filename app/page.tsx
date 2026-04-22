"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardTab from "@/components/DashboardTab";
import ParentTab from "@/components/ParentTab";
import PhilosophyTab from "@/components/PhilosophyTab";
import PlayerTab from "@/components/PlayerTab";
import { defaultClubs } from "@/lib/defaultClubs";
import { average, getPlayerStats, sanitizeClubs } from "@/lib/playerStats";
import { styles } from "@/lib/styles";
import { supabase } from "@/lib/supabase";
import { Player, PlayerForm, Round, Tab } from "@/types/golf";

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<Tab>("player");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showArchivedPlayers, setShowArchivedPlayers] = useState(false);

  const [playerForm, setPlayerForm] = useState<PlayerForm>({
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
        archived: Boolean(player.archived),
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
    setLoading(false);
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const visiblePlayers = useMemo(() => {
    return showArchivedPlayers
      ? players
      : players.filter((player) => !player.archived);
  }, [players, showArchivedPlayers]);

  useEffect(() => {
    if (visiblePlayers.length === 0) {
      setSelectedPlayerId("");
      return;
    }

    const stillVisible = visiblePlayers.some(
      (player) => player.id === selectedPlayerId
    );

    if (!stillVisible) {
      setSelectedPlayerId(visiblePlayers[0].id);
    }
  }, [visiblePlayers, selectedPlayerId]);

  const selectedPlayer =
    visiblePlayers.find((player) => player.id === selectedPlayerId) ??
    visiblePlayers[0] ??
    null;

  useEffect(() => {
    if (!selectedPlayer) return;

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
  }, [selectedPlayer]);

  const selectedPlayerStats = selectedPlayer
    ? getPlayerStats(selectedPlayer)
    : null;

  const dashboardPlayers = useMemo(() => {
    return [...visiblePlayers]
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
  }, [visiblePlayers]);

  const totalRounds = visiblePlayers.reduce(
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
      archived: false,
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

  const toggleArchivePlayer = async () => {
    if (!selectedPlayer) return;

    const nextArchived = !selectedPlayer.archived;
    const actionLabel = nextArchived ? "archive" : "unarchive";

    const confirmed = window.confirm(
      `${nextArchived ? "Archive" : "Unarchive"} ${selectedPlayer.name}?`
    );
    if (!confirmed) return;

    setErrorMessage("");

    const { error } = await supabase
      .from("players")
      .update({ archived: nextArchived })
      .eq("id", selectedPlayer.id);

    if (error) {
      setErrorMessage(
        `${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} player failed: ${error.message}`
      );
      return;
    }

    await loadPlayers();
  };

  const deletePlayer = async () => {
    if (!selectedPlayer) return;

    const confirmed = window.confirm(
      `Delete ${selectedPlayer.name}? This will also delete all of their rounds.`
    );
    if (!confirmed) return;

    setErrorMessage("");

    const { error: roundsError } = await supabase
      .from("rounds")
      .delete()
      .eq("player_id", selectedPlayer.id);

    if (roundsError) {
      setErrorMessage(`Delete player rounds failed: ${roundsError.message}`);
      return;
    }

    const { error: playerError } = await supabase
      .from("players")
      .delete()
      .eq("id", selectedPlayer.id);

    if (playerError) {
      setErrorMessage(`Delete player failed: ${playerError.message}`);
      return;
    }

    await loadPlayers();
  };

  const updateLocalClubDistance = (clubIndex: number, value: number) => {
    const updatedClubs = [...playerForm.clubs];
    updatedClubs[clubIndex] = {
      ...updatedClubs[clubIndex],
      distance: Number.isNaN(value) ? 0 : value,
    };

    setPlayerForm((prev) => ({
      ...prev,
      clubs: updatedClubs,
    }));
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

  if (!selectedPlayer && visiblePlayers.length === 0) {
    return (
      <main style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>Golf Team App</h1>
          <p style={styles.heroText}>
            {players.length === 0
              ? "No players yet. Add your first player."
              : "No visible players. Turn on archived players or add a new player."}
          </p>
        </div>

        {errorMessage ? <div style={styles.error}>{errorMessage}</div> : null}

        <div style={styles.card}>
          <label style={styles.fieldRow}>
            <input
              type="checkbox"
              checked={showArchivedPlayers}
              onChange={(e) => setShowArchivedPlayers(e.target.checked)}
            />
            <span>Show Archived Players</span>
          </label>

          <div style={styles.fieldRow}>
            <button onClick={addPlayer} style={styles.button}>
              Add Player
            </button>
            <button onClick={loadPlayers} style={styles.secondaryButton}>
              Retry Load
            </button>
          </div>
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

      <div style={styles.card}>
        <label style={styles.fieldRow}>
          <input
            type="checkbox"
            checked={showArchivedPlayers}
            onChange={(e) => setShowArchivedPlayers(e.target.checked)}
          />
          <span>Show Archived Players</span>
        </label>
      </div>

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

      {activeTab === "philosophy" && <PhilosophyTab />}

      {activeTab === "player" && (
        <PlayerTab
          players={visiblePlayers}
          selectedPlayer={selectedPlayer}
          selectedPlayerId={selectedPlayerId}
          setSelectedPlayerId={setSelectedPlayerId}
          playerForm={playerForm}
          setPlayerForm={setPlayerForm}
          roundDrafts={roundDrafts}
          addPlayer={addPlayer}
          deletePlayer={deletePlayer}
          toggleArchivePlayer={toggleArchivePlayer}
          addClub={addClub}
          removeClub={removeClub}
          updateLocalClubName={updateLocalClubName}
          updateLocalClubDistance={updateLocalClubDistance}
          savePlayer={savePlayer}
          saveYardages={saveYardages}
          addRound={addRound}
          updateLocalRoundField={updateLocalRoundField}
          saveRound={saveRound}
          deleteRound={deleteRound}
          selectedPlayerStats={selectedPlayerStats}
        />
      )}

      {activeTab === "dashboard" && (
        <DashboardTab
          players={visiblePlayers}
          totalRounds={totalRounds}
          teamAverageScore={teamAverageScore}
          bestAveragePlayer={bestAveragePlayer}
          highestPenaltyPlayer={highestPenaltyPlayer}
          highestThreePuttPlayer={highestThreePuttPlayer}
          mostImprovedPlayer={mostImprovedPlayer}
          dashboardPlayers={dashboardPlayers}
          showArchivedPlayers={showArchivedPlayers}
        />
      )}

      {activeTab === "parent" && (
        <ParentTab
          players={visiblePlayers}
          selectedPlayer={selectedPlayer}
          selectedPlayerId={selectedPlayerId}
          setSelectedPlayerId={setSelectedPlayerId}
          selectedPlayerStats={selectedPlayerStats}
        />
      )}
    </main>
  );
}