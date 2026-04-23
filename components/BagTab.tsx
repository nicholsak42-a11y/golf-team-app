"use client";

import { useEffect, useMemo, useState } from "react";
import { styles } from "@/lib/styles";
import { Player, PlayerForm, YardageLog } from "@/types/golf";

type BagTabProps = {
  players: Player[];
  selectedPlayerId: string;
  setSelectedPlayerId: (value: string) => void;
  playerForm: PlayerForm;
  setPlayerForm: React.Dispatch<React.SetStateAction<PlayerForm>>;
  addClub: () => void;
  removeClub: (clubIndex: number) => void;
  updateLocalClubName: (clubIndex: number, value: string) => void;
  updateLocalClubDistance: (clubIndex: number, value: number) => void;
  saveYardages: () => Promise<void>;
  yardageLogs: YardageLog[];
  addYardageLog: (club: string, distance: number) => Promise<void>;
};

function average(numbers: number[]) {
  if (numbers.length === 0) return 0;
  return Math.round(
    numbers.reduce((total, value) => total + value, 0) / numbers.length
  );
}

export default function BagTab({
  players,
  selectedPlayerId,
  setSelectedPlayerId,
  playerForm,
  setPlayerForm,
  addClub,
  removeClub,
  updateLocalClubName,
  updateLocalClubDistance,
  saveYardages,
  yardageLogs,
  addYardageLog,
}: BagTabProps) {
  const [playerSearch, setPlayerSearch] = useState("");
  const [shotClub, setShotClub] = useState("");
  const [shotDistance, setShotDistance] = useState("");

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

  useEffect(() => {
    if (!shotClub && playerForm.clubs.length > 0) {
      setShotClub(playerForm.clubs[0].club);
    }
  }, [playerForm.clubs, shotClub]);

  const averagesByClub = useMemo(() => {
    const grouped: Record<string, number[]> = {};

    for (const log of yardageLogs) {
      if (!grouped[log.club]) grouped[log.club] = [];
      grouped[log.club].push(log.distance);
    }

    return Object.fromEntries(
      Object.entries(grouped).map(([club, distances]) => [
        club,
        {
          average: average(distances),
          count: distances.length,
        },
      ])
    );
  }, [yardageLogs]);

  const handleSaveShot = async () => {
    const distance = Number(shotDistance);
    if (!shotClub || Number.isNaN(distance) || distance <= 0) return;

    await addYardageLog(shotClub, distance);
    setShotDistance("");
  };

  return (
    <section style={styles.section}>
      <div style={styles.card}>
        <h2 style={{ marginTop: 0 }}>Bag Setup</h2>

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
                  {player.archived ? " (Archived)" : ""}
                </option>
              ))
            )}
          </select>
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

        {playerForm.clubs.map((club, clubIndex) => {
          const clubStats = averagesByClub[club.club];
          return (
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
              <span style={styles.mutedText}>
                Avg: {clubStats ? clubStats.average : "-"}
              </span>
              <span style={styles.mutedText}>
                Samples: {clubStats ? clubStats.count : 0}
              </span>
              <button
                onClick={() => removeClub(clubIndex)}
                style={styles.secondaryButton}
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Record a Shot</h3>

        <div style={styles.fieldRow}>
          <select
            value={shotClub}
            onChange={(e) => setShotClub(e.target.value)}
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

          <input
            type="number"
            value={shotDistance}
            onChange={(e) => setShotDistance(e.target.value)}
            placeholder="Distance"
            style={styles.smallInput}
          />

          <span>yards</span>

          <button onClick={handleSaveShot} style={styles.button}>
            Save Shot
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Recent Shots</h3>
        {yardageLogs.length === 0 ? (
          <p>No shots recorded yet.</p>
        ) : (
          yardageLogs.slice(0, 10).map((log) => (
            <div key={log.id} style={styles.roundCard}>
              <div style={styles.infoGrid}>
                <p>Club: {log.club}</p>
                <p>Distance: {log.distance} yards</p>
                <p>
                  Time: {new Date(log.createdAt).toLocaleDateString()}{" "}
                  {new Date(log.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}