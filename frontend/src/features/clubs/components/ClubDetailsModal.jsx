import { useState } from 'react';
import {
  AlertCircle,
  Crown,
  LogOut,
  UserPlus,
    MessageCircle,                           // ← add
  Users,
  X,
} from 'lucide-react';

import { Link } from 'react-router-dom';   // ← add (use 'react-router' if you're on v7 without react-router-dom)

import { useAuth } from '../../auth/context/AuthContext';
import {
  useClubMembers,
  useLeaveClub,
  useRequestToJoinClub,
  useUpdateMemberRole,
} from '../hooks/useClubs';

import { getFileUrl } from '../../../utils/files';
import JoinRequestsPanel from './JoinRequestsPanel';

const LOCAL_ROLES = [
  'member',
  'manager',
  'treasurer',
  'sponsor_director',
  'marketing_director',
];

const ROLE_LABELS = {
  member: 'Member',
  manager: 'Manager',
  treasurer: 'Treasurer',
  sponsor_director: 'Sponsor Director',
  marketing_director: 'Marketing Director',
};

function getApiError(error) {
  const message = error?.response?.data?.message;

  return Array.isArray(message)
    ? message.join(', ')
    : message || 'Action failed.';
}

export default function ClubDetailsModal({
  club,
  onClose,
  onFeedback,
}) {
  const { user } = useAuth();

  const [error, setError] = useState('');

  const { data: members, isLoading } = useClubMembers(
    club?.id,
    Boolean(club),
  );

  const requestToJoin = useRequestToJoinClub();
  const leaveClub = useLeaveClub();
  const updateMemberRole = useUpdateMemberRole(club?.id);

  if (!club) {
    return null;
  }

  const imageUrl = getFileUrl(club.image);
  const isAdmin = user?.role === 'admin';
  const membershipStatus = club.membershipStatus;
  const isManager = club.myRole === 'manager';

  const isBusy =
    requestToJoin.isPending ||
    leaveClub.isPending ||
    updateMemberRole.isPending;

  const approvedMembers = members ?? [];

  const handleRequestJoin = () => {
    setError('');

    requestToJoin.mutate(club.id, {
      onSuccess: () => {
        onFeedback?.(
          'success',
          `Your request to join ${club.name} was sent to the club manager.`,
        );

        onClose();
      },
      onError: (apiError) => {
        setError(getApiError(apiError));
      },
    });
  };

  const handleLeaveOrCancel = () => {
    setError('');

    leaveClub.mutate(club.id, {
      onSuccess: () => {
        const message =
          membershipStatus === 'pending'
            ? 'Your membership request was cancelled.'
            : `You left ${club.name}.`;

        onFeedback?.('success', message);
        onClose();
      },
      onError: (apiError) => {
        setError(getApiError(apiError));
      },
    });
  };

  const handleRoleChange = (member, role) => {
    setError('');

    updateMemberRole.mutate(
      {
        userId: member.user.id,
        role,
      },
      {
        onSuccess: () => {
          onFeedback?.(
            'success',
            `${member.user.firstName}'s club role was updated.`,
          );
        },
        onError: (apiError) => {
          setError(getApiError(apiError));
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {imageUrl && (
          <div className="h-40 relative">
            <img
              src={imageUrl}
              alt={club.name}
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {club.name}
              </h2>

              <p className="text-xs text-indigo-300 mt-1">
                {club.category}
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed mt-4">
            {club.description}
          </p>

          {error && (
            <div className="mt-4 flex gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {club.isMember && (
  <Link
    to={`/app/channels?clubId=${club.id}`}
    onClick={onClose}
    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/25 text-xs font-semibold transition"
  >
    <MessageCircle className="w-4 h-4" /> Open Club Chat
  </Link>
)}

          {/* Approved members */}
          <section className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-indigo-400" />
              Approved Members ({approvedMembers.length})
            </h3>

            {isLoading ? (
              <p className="text-xs text-slate-500">
                Loading members...
              </p>
            ) : approvedMembers.length === 0 ? (
              <p className="text-xs text-slate-500">
                No approved members yet.
              </p>
            ) : (
              <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {approvedMembers.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">
                        {member.user.firstName} {member.user.lastName}
                      </p>

                      <p className="text-[11px] text-slate-500 truncate">
                        {member.user.email}
                      </p>
                    </div>

                    {isManager ? (
                      <select
                        value={member.role}
                        disabled={isBusy}
                        onChange={(event) =>
                          handleRoleChange(member, event.target.value)
                        }
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-white disabled:opacity-50"
                      >
                        {LOCAL_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${
                          member.role === 'manager'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-slate-700/60 text-slate-300'
                        }`}
                      >
                        {member.role === 'manager' && (
                          <Crown className="w-3 h-3 inline mr-1 -mt-0.5" />
                        )}

                        {ROLE_LABELS[member.role] ?? member.role}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Visible only for manager */}
          <JoinRequestsPanel
            club={club}
            onFeedback={onFeedback}
          />

          {/* Student actions */}
          <div className="mt-6 flex justify-end gap-3">
            {membershipStatus === 'approved' ? (
              club.myRole === 'manager' ? (
                <p className="text-[11px] text-slate-500 text-right">
                  You manage this club. Assign another approved manager before leaving.
                </p>
              ) : (
                <button
                  onClick={handleLeaveOrCancel}
                  disabled={isBusy}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-semibold disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  {leaveClub.isPending ? 'Leaving...' : 'Leave Club'}
                </button>
              )
            ) : membershipStatus === 'pending' ? (
              <button
                onClick={handleLeaveOrCancel}
                disabled={isBusy}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-semibold disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                {leaveClub.isPending ? 'Cancelling...' : 'Cancel Request'}
              </button>
            ) : !isAdmin ? (
  <button
    onClick={handleRequestJoin}
    disabled={isBusy}
    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold"
  >
    <UserPlus className="w-4 h-4" />
    {requestToJoin.isPending
      ? 'Sending...'
      : membershipStatus === 'rejected'
        ? 'Request Again'
        : 'Request to Join'}
  </button>
) : null}
          </div>
        </div>
      </div>
    </div>
  );
}