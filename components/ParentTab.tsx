"use client";

import { useEffect, useMemo, useState } from "react";
import { styles } from "@/lib/styles";
import { Player, PlayerStats, Round } from "@/types/golf";

type ParentTabProps = {
  players: Player[];
  selectedPlayer: Player;
  selectedPlayerId: string;
  setSelectedPlayerId: (value: string) => void;
  selectedPlayerStats: PlayerStats | null;
  parentNotesDraft: string;
  setParentNotesDraft: React.Dispatch<React.SetStateAction<string>>;
  saveParentNotes: () => Promise<void>;
};

function getLatestRound(rounds: Round[]) {
  return rounds.length > 0 ? rounds[0] : null;
}

function getBestRound(rounds: Round[]) {
  if (rounds.length === 0) return null;
  return rounds.reduce((best, current) =>
    current.score < best.score ? current : best
  );
}

function getScoreChangeFromPrevious(rounds: Round[]) {
  if (rounds.length < 2) return null;
  return rounds[0].score - rounds[1].score;
}

export default function ParentTab({
  players,
  selectedPlayer,
  selectedPlayerId,
  setSelectedPlayerId,
  selectedPlayerStats,
  parentNotesDraft,
  setParentNotesDraft,
  saveParentNotes,
}: ParentTabProps) {
  const [playerSearch, setPlayerSearch] = useState("");

  const filteredPlayers = useMemo(() => {
    const query = playerSearch.trim().toLowerCase();
    if (!query) return players;
    return players.filter((player) =>
      player.name.toLowerCase().includes(query)
    );
  }, [players, playerSearch]);

  useEffect(() => {
    if (
      filteredPlayers.length === 1 &&
      filteredPlayers[0].id !== selectedPlayerId
    ) {
      setSelectedPlayerId(filteredPlayers[0].id);
    }
  }, [filteredPlayers, selectedPlayerId, setSelectedPlayerId]);

  const selectValue = filteredPlayers.some(
    (player) => player.id === selectedPlayerId
  )
    ? selectedPlayerId
    : filteredPlayers[0]?.id ?? "";

  const latestRound = getLatestRound(selectedPlayer.rounds);
  const bestRound = getBestRound(selectedPlayer.rounds);
  const scoreChange = getScoreChangeFromPrevious(selectedPlayer.rounds);

  return (
    <section style={styles.section}>
      <div style={styles.card}>
        <h2>Parent View</h2>

        <label style={styles.field}>
          <span>Search Player</span>
          <input
            value={playerSearch}
            onChange={(e) => setPlayerSearch(e.target.value)}
            placeholder="Type a player name..."
            style={styles.input}
          />
        </label>

        <label style={styles.field}>
          <span>Select Player</span>
          <select
            value={selectValue}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            style={styles.input}
          >
            {filteredPlayers.length === 0 ? (
              <option value="">No matching players</option>
            ) : (
              filteredPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))
            )}
          </select>
        </label>

        <h3>{selectedPlayer.name}</h3>
        <div style={styles.infoGrid}>
          <p>Free Throw Club: {selectedPlayer.freeThrowClub}</p>
          <p>Rounds Logged: {selectedPlayerStats?.roundsLogged ?? 0}</p>
          <p>Average Score: {selectedPlayerStats?.averageScore ?? 0}</p>
          <p>
            Recent 3-Round Avg: {selectedPlayerStats?.recentAverageScore ?? 0}
          </p>
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
        <h3>Latest Round Summary</h3>
        {latestRound ? (
          <>
            <div style={styles.infoGrid}>
              <p>Date: {latestRound.date}</p>
              <p>Score: {latestRound.score}</p>
              <p>Penalties: {latestRound.penalties}</p>
              <p>3-Putts: {latestRound.threePutts}</p>
              <p>Doubles: {latestRound.doubles}</p>
              <p>
                Change From Previous:{" "}
                {scoreChange === null
                  ? "Not enough data"
                  : scoreChange < 0
                  ? `${Math.abs(scoreChange)} better`
                  : scoreChange > 0
                  ? `${scoreChange} worse`
                  : "No change"}
              </p>
            </div>
            <p>
              Notes:{" "}
              {latestRound.notes && latestRound.notes.trim().length > 0
                ? latestRound.notes
                : "None"}
            </p>
          </>
        ) : (
          <p>No rounds recorded yet.</p>
        )}
      </div>

      <div style={styles.card}>
        <h3>Best Round Summary</h3>
        {bestRound ? (
          <>
            <div style={styles.infoGrid}>
              <p>Date: {bestRound.date}</p>
              <p>Score: {bestRound.score}</p>
              <p>Penalties: {bestRound.penalties}</p>
              <p>3-Putts: {bestRound.threePutts}</p>
              <p>Doubles: {bestRound.doubles}</p>
            </div>
            <p>
              Notes:{" "}
              {bestRound.notes && bestRound.notes.trim().length > 0
                ? bestRound.notes
                : "None"}
            </p>
          </>
        ) : (
          <p>No rounds recorded yet.</p>
        )}
      </div>

      <div style={styles.card}>
        <h3>Parent Notes</h3>

        <textarea
          value={parentNotesDraft}
          onChange={(e) => setParentNotesDraft(e.target.value)}
          style={{
            ...styles.input,
            minHeight: "120px",
            resize: "vertical",
            width: "100%",
          }}
        />

        <div style={{ marginTop: "12px" }}>
          <button onClick={saveParentNotes} style={styles.button}>
            Save Parent Notes
          </button>
        </div>
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