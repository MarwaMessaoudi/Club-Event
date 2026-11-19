import { Users, UserPlus, Clock3, CheckCircle2 } from 'lucide-react';
import { getFileUrl } from '../../../utils/files';

export default function ClubCard({
  club,
  onView,
  onRequestJoin,
  requesting,
}) {
  const imageUrl = getFileUrl(club.image);

  const membershipStatus = club.membershipStatus;

  const requestLabel =
    membershipStatus === 'rejected'
      ? 'Request Again'
      : 'Request to Join';

  return (
    <article className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:border-indigo-500/40 transition group">
      <div className="relative h-40 bg-slate-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={club.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-12 h-12 text-indigo-400/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />

        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-950/80 text-indigo-300 border border-slate-700">
          {club.category}
        </span>

        {club.myRole && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-600/90 text-white">
            {club.myRole.replaceAll('_', ' ')}
          </span>
        )}

        {club.myRole === 'manager' && club.pendingCount > 0 && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
            {club.pendingCount} request{club.pendingCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="p-5 flex-1">
        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
          {club.name}
        </h3>

        <p className="text-xs text-slate-400 mt-2 line-clamp-2">
          {club.description}
        </p>

        <div className="flex items-center gap-2 mt-4 text-[11px] text-slate-500">
          <Users className="w-3.5 h-3.5 text-indigo-400" />

          <span>
            {club.membersCount} member{club.membersCount === 1 ? '' : 's'}
          </span>

          {club.createdBy && (
            <>
              <span className="text-slate-700">•</span>

              <span>
                by {club.createdBy.firstName} {club.createdBy.lastName}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={() => onView(club)}
          className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
        >
          Details
        </button>

        {membershipStatus === 'approved' ? (
          <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Joined
          </span>
        ) : membershipStatus === 'pending' ? (
          <span className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5" />
            Pending
          </span>
        ) : (
          <button
            onClick={() => onRequestJoin(club)}
            disabled={requesting}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <UserPlus className="w-3.5 h-3.5" />

            {requesting ? 'Sending...' : requestLabel}
          </button>
        )}
      </div>
    </article>
  );
}