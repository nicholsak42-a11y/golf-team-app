type Props = {
  currentUserRole: string;
  players?: { id: string; name: string }[];
  players?: { id: string; name: string; user_id?: string | null }[];
};

export default function StudentLinksTab({
  currentUserRole,
  players = [],
}: Props) {
  if (currentUserRole !== "coach") return null;

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Student Links</h2>

      <p className="mt-2 text-sm text-gray-600">
        This section will be used to connect student accounts to player records.
      </p>

      <div className="mt-4 space-y-2">
        {players.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-gray-500">
            No players found.
          </div>
        ) : (
          players.map((player) => (
  <div key={player.id} className="rounded-lg border p-3">
    <div className="font-medium">{player.name}</div>
    <div className="text-sm text-gray-500">
      {player.user_id ? "Linked to student" : "Not linked"}
    </div>
  </div>
))
        )}
      </div>
    </div>
  );
}