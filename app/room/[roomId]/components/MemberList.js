// app/room/[roomId]/components/MemberList.js
export default function MemberList({ members, gameCards }) {
  const memberStatus = {};
  Object.values(gameCards).forEach((card) => {
    if (card.status !== 'waiting' && card.status !== 'active') return;
    card.participants.forEach((p) => {
      memberStatus[p.name] = { role: 'playing', gameName: card.gameName };
    });
    card.spectators.forEach((s) => {
      memberStatus[s.name] = { role: 'watching', gameName: card.gameName };
    });
  });

  return (
    <div className="flex flex-col">
      {members.map((member) => {
        const status = memberStatus[member.name];
        return (
          <div key={member.id ?? member.name} className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden />
              <span
                className="text-sm text-slate-800 font-medium"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {member.name}
              </span>
            </div>
            {status && (
              <span
                className={`text-xs font-semibold ${
                  status.role === 'playing' ? 'text-indigo-700' : 'text-slate-500'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {status.role === 'playing' ? 'playing' : 'watching'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
