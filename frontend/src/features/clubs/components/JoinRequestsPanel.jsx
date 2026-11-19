import { Check, X, UserPlus, AlertCircle } from 'lucide-react';
import {
  useClubJoinRequests,
  useDecideJoinRequest,
} from '../hooks/useClubs';

export default function JoinRequestsPanel({
  club,
  onFeedback,
}) {
  const isManager = club?.myRole === 'manager';

  const {
    data: requests,
    isLoading,
    isError,
  } = useClubJoinRequests(club?.id, isManager);

  const decideRequest = useDecideJoinRequest(club?.id);

  if (!isManager) {
    return null;
  }

  const handleDecision = (request, status) => {
    decideRequest.mutate(
      {
        requestId: request.id,
        status,
      },
      {
        onSuccess: () => {
          onFeedback?.(
            'success',
            `${request.user.firstName} ${
              status === 'approved' ? 'was accepted into' : 'was rejected from'
            } ${club.name}.`,
          );
        },
        onError: (error) => {
          const message = error.response?.data?.message;

          onFeedback?.(
            'error',
            Array.isArray(message)
              ? message.join(', ')
              : message || 'Unable to review join request.',
          );
        },
      },
    );
  };

  return (
    <section className="mt-6 border-t border-slate-800 pt-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2 mb-3">
        <UserPlus className="w-4 h-4" />
        Pending Join Requests
      </h3>

      {isLoading ? (
        <p className="text-xs text-slate-500">
          Loading join requests...
        </p>
      ) : isError ? (
        <div className="flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4" />
          Unable to load join requests.
        </div>
      ) : !requests?.length ? (
        <p className="text-xs text-slate-500">
          No pending requests.
        </p>
      ) : (
        <div className="space-y-2">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl p-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">
                  {request.user.firstName} {request.user.lastName}
                </p>

                <p className="text-[11px] text-slate-500 truncate">
                  {request.user.email}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  disabled={decideRequest.isPending}
                  onClick={() =>
                    handleDecision(request, 'approved')
                  }
                  title="Accept request"
                  className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white"
                >
                  <Check className="w-4 h-4" />
                </button>

                <button
                  disabled={decideRequest.isPending}
                  onClick={() =>
                    handleDecision(request, 'rejected')
                  }
                  title="Reject request"
                  className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 disabled:opacity-50 text-rose-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}