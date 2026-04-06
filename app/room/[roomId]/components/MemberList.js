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
          <div key={member.id} className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/90 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <span
                className="text-sm text-violet-100/95"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {member.name}
              </span>
            </div>
            {status && (
              <span
                className={`text-xs font-medium ${
                  status.role === 'playing' ? 'text-fuchsia-300/90' : 'text-violet-200/50'
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
