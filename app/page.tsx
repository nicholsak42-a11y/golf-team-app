"use client";

import { useEffect, useState } from "react";

type Club = {
  club: string;
  distance: number;
};

type Round = {
  date: string;
  score: number;
  penalties: number;
  threePutts: number;
  doubles: number;
  notes: string;
};

type Player = {
  name: string;
  freeThrowClub: string;
  clubs: Club[];
  rounds: Round[];
};

const defaultPlayers: Player[] = [
  {
    name: "Player 1",
    freeThrowClub: "PW",
    clubs: [
      { club: "3 Wood", distance: 180 },
      { club: "Hybrid", distance: 150 },
      { club: "7 Iron", distance: 110 },
      { club: "PW", distance: 80 },
      { club: "SW", distance: 60 },
    ],
    rounds: [],
  },
];

function average(numbers: number[]) {
  if (numbers.length === 0) return 0;
  return Math.round(
    (numbers.reduce((a, b) => a + b, 0) / numbers.length) * 10
  ) / 10;
}

function normalizePlayers(data: unknown): Player[] {
  if (!Array.isArray(data)) return defaultPlayers;

  return data.map((player: any) => ({
    name: player?.name ?? "Player",
    freeThrowClub: player?.freeThrowClub ?? "PW",
    clubs: Array.isArray(player?.clubs)
      ? player.clubs.map((club: any) => ({
          club: club?.club ?? "Club",
          distance: Number(club?.distance ?? 0),
        }))
      : [
          { club: "3 Wood", distance: 0 },
          { club: "Hybrid", distance: 0 },
          { club: "7 Iron", distance: 0 },
          { club: "PW", distance: 0 },
          { club: "SW", distance: 0 },
        ],
    rounds: Array.isArray(player?.rounds)
      ? player.rounds.map((round: any) => ({
          date: round?.date ?? new Date().toISOString().slice(0, 10),
          score: Number(round?.score ?? 0),
          penalties: Number(round?.penalties ?? 0),
          threePutts: Number(round?.threePutts ?? 0),
          doubles: Number(round?.doubles ?? 0),
          notes: round?.notes ?? "",
        }))
      : [],
  }));
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>(defaultPlayers);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedPlayers = localStorage.getItem("golf-team-players");
    const savedIndex = localStorage.getItem("golf-team-selected-player");

    if (savedPlayers) {
      try {
        setPlayers(normalizePlayers(JSON.parse(savedPlayers)));
      } catch {
        setPlayers(defaultPlayers);
      }
    }

    if (savedIndex) {
      const parsedIndex = Number(savedIndex);
      if (!Number.isNaN(parsedIndex)) {
        setSelectedPlayerIndex(parsedIndex);
      }
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem("golf-team-players", JSON.stringify(players));
    localStorage.setItem(
      "golf-team-selected-player",
      selectedPlayerIndex.toString()
    );
  }, [players, selectedPlayerIndex, isLoaded]);

  const selectedPlayer = players[selectedPlayerIndex];

  const addPlayer = () => {
    const updatedPlayers = [
      ...players,
      {
        name: `Player ${players.length + 1}`,
        freeThrowClub: "PW",
        clubs: [
          { club: "3 Wood", distance: 0 },
          { club: "Hybrid", distance: 0 },
          { club: "7 Iron", distance: 0 },
          { club: "PW", distance: 0 },
          { club: "SW", distance: 0 },
        ],
        rounds: [],
      },
    ];

    setPlayers(updatedPlayers);
    setSelectedPlayerIndex(updatedPlayers.length - 1);
  };

  const updatePlayerName = (value: string) => {
    const updated = [...players];
    updated[selectedPlayerIndex].name = value;
    setPlayers(updated);
  };

  const updateFreeThrowClub = (value: string) => {
    const updated = [...players];
    updated[selectedPlayerIndex].freeThrowClub = value;
    setPlayers(updated);
  };

  const updateClubDistance = (clubIndex: number, value: number) => {
    const updated = [...players];
    updated[selectedPlayerIndex].clubs[clubIndex].distance = value;
    setPlayers(updated);
  };

  const addRound = () => {
    const updated = [...players];
    updated[selectedPlayerIndex].rounds.push({
      date: new Date().toISOString().slice(0, 10),
      score: 0,
      penalties: 0,
      threePutts: 0,
      doubles: 0,
      notes: "",
    });
    setPlayers(updated);
  };

  const updateRoundField = (
    roundIndex: number,
    field: keyof Round,
    value: string | number
  ) => {
    const updated = [...players];
    updated[selectedPlayerIndex].rounds[roundIndex] = {
      ...updated[selectedPlayerIndex].rounds[roundIndex],
      [field]: value,
    };
    setPlayers(updated);
  };

  if (!selectedPlayer) {
    return (
      <main style={{ padding: "20px", color: "black" }}>
        <h1>Golf Team App</h1>
        <p>No player selected.</p>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: "20px",
        maxWidth: "900px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        color: "black",
        backgroundColor: "#f4f7f5",
        minHeight: "100vh",
      }}
    >
      <h1>Golf Team App</h1>

      <h2>Team Philosophy</h2>
      <p>Get near the green → one chip → two putts</p>
      <p>Double bogey is success. Bogey is a bonus.</p>

      <hr style={{ margin: "20px 0" }} />

      <h2>Players</h2>
      <button onClick={addPlayer}>Add Player</button>

      <div style={{ marginTop: "12px", marginBottom: "12px" }}>
        <label>
          Select Player:{" "}
          <select
            value={selectedPlayerIndex}
            onChange={(e) => setSelectedPlayerIndex(Number(e.target.value))}
          >
            {players.map((player, index) => (
              <option key={index} value={index}>
                {player.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label>
          Player Name:{" "}
          <input
            type="text"
            value={selectedPlayer.name}
            onChange={(e) => updatePlayerName(e.target.value)}
          />
        </label>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label>
          Free Throw Club:{" "}
          <input
            type="text"
            value={selectedPlayer.freeThrowClub}
            onChange={(e) => updateFreeThrowClub(e.target.value)}
          />
        </label>
      </div>

      <h3>Yardages</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {selectedPlayer.clubs.map((club, clubIndex) => (
          <li key={club.club} style={{ marginBottom: "10px" }}>
            <label>
              {club.club}:{" "}
              <input
                type="number"
                value={club.distance}
                onChange={(e) =>
                  updateClubDistance(clubIndex, Number(e.target.value))
                }
                style={{ width: "80px" }}
              />{" "}
              yards
            </label>
          </li>
        ))}
      </ul>

      <hr style={{ margin: "20px 0" }} />

      <h2>Round Tracker</h2>
      <button onClick={addRound}>Add Round</button>

      {selectedPlayer.rounds.length === 0 && <p>No rounds added yet.</p>}

      {selectedPlayer.rounds.map((round, index) => (
        <div
          key={index}
          style={{
            marginTop: "10px",
            border: "1px solid #ccc",
            padding: "12px",
            borderRadius: "8px",
            backgroundColor: "white",
          }}
        >
          <div style={{ marginBottom: "8px" }}>
            <label>
              Date:{" "}
              <input
                type="date"
                value={round.date}
                onChange={(e) =>
                  updateRoundField(index, "date", e.target.value)
                }
              />
            </label>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <label>
              Score:{" "}
              <input
                type="number"
                value={round.score}
                onChange={(e) =>
                  updateRoundField(index, "score", Number(e.target.value))
                }
                style={{ width: "80px" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <label>
              Penalties:{" "}
              <input
                type="number"
                value={round.penalties}
                onChange={(e) =>
                  updateRoundField(index, "penalties", Number(e.target.value))
                }
                style={{ width: "80px" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <label>
              3-Putts:{" "}
              <input
                type="number"
                value={round.threePutts}
                onChange={(e) =>
                  updateRoundField(index, "threePutts", Number(e.target.value))
                }
                style={{ width: "80px" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <label>
              Doubles or Worse:{" "}
              <input
                type="number"
                value={round.doubles}
                onChange={(e) =>
                  updateRoundField(index, "doubles", Number(e.target.value))
                }
                style={{ width: "80px" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "8px" }}>
            <label>
              Notes:{" "}
              <input
                type="text"
                value={round.notes}
                onChange={(e) =>
                  updateRoundField(index, "notes", e.target.value)
                }
              />
            </label>
          </div>
        </div>
      ))}

      <hr style={{ margin: "20px 0" }} />

      <h2>Current Player Summary</h2>
      <p>
        <strong>Name:</strong> {selectedPlayer.name}
      </p>
      <p>
        <strong>Free Throw Club:</strong> {selectedPlayer.freeThrowClub}
      </p>
      <p>
        <strong>Rounds Logged:</strong> {selectedPlayer.rounds.length}
      </p>
      <p>
        <strong>Average Score:</strong>{" "}
        {average(selectedPlayer.rounds.map((r) => r.score))}
      </p>
      <p>
        <strong>Avg Penalties:</strong>{" "}
        {average(selectedPlayer.rounds.map((r) => r.penalties))}
      </p>
      <p>
        <strong>Avg 3-Putts:</strong>{" "}
        {average(selectedPlayer.rounds.map((r) => r.threePutts))}
      </p>
    </main>
  );
}