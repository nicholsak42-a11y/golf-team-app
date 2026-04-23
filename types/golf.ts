export type Club = {
  club: string;
  distance: number;
};

export type YardageLog = {
  id: string;
  playerId: string;
  club: string;
  distance: number;
  createdAt: string;
};

export type Round = {
  id: string;
  date: string;
  score: number;
  penalties: number;
  threePutts: number;
  doubles: number;
  notes: string;
};

export type Player = {
  id: string;
  name: string;
  freeThrowClub: string;
  clubs: Club[];
  rounds: Round[];
  archived: boolean;
  coachNotes: string;
  parentNotes: string;
  user_id?: string | null;
};

export type Tab = "philosophy" | "player" | "bag" | "dashboard" | "parent" | "student-links";

export type PlayerForm = {
  name: string;
  freeThrowClub: string;
  clubs: Club[];
  coachNotes: string;
  parentNotes: string;
};

export type PlayerStats = {
  roundsLogged: number;
  averageScore: number;
  recentAverageScore: number;
  bestRound: number;
  averagePenalties: number;
  averageThreePutts: number;
  averageDoubles: number;
  trend: string;
  focusArea: string;
};