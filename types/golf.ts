export type Club = {
  club: string;
  distance: number;
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
};

export type Tab = "philosophy" | "player" | "dashboard" | "parent";

export type PlayerForm = {
  name: string;
  freeThrowClub: string;
  clubs: Club[];
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