import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Users,
  Shield,
  UserCog,
  Ban,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';

import {
  useUsers,
  useUpdateUserRole,
  useUpdateUserStatus,
} from '../hooks/useUsers';

import Pagination from '../../../components/ui/Pagination';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { formatDate } from '../../../utils/dates';
import { useAuth } from '../../auth/context/AuthContext';

const LIMIT = 10;

const ROLE_OPTIONS = ['student', 'supervisor', 'admin'];
const STATUS_OPTIONS = ['active', 'suspended'];

function pretty(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const role = searchParams.get('role') || '';
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [feedback, setFeedback] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      ...(search ? { search } : {}),
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
    }),
    [page, search, role, status],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useUsers(params);

  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();

  const users = data?.data ?? [];
  const meta = data?.meta;

  const setParams = (updates) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      const shouldDelete =
        value === '' ||
        value == null ||
        (key === 'page' && Number(value) <= 1);

      if (shouldDelete) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.trim() !== search) {
        setParams({ search: searchInput.trim(), page: 1 });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const getApiError = (err) => {
    const message = err.response?.data?.message;
    return Array.isArray(message)
      ? message.join(', ')
      : message || 'Operation failed.';
  };

  const handleRoleChange = (targetUser, newRole) => {
    if (targetUser.id === currentUser.id) {
      setFeedback({
        type: 'error',
        text: 'You cannot change your own role.',
      });
      return;
    }

    updateRole.mutate(
      { id: targetUser.id, role: newRole },
      {
        onSuccess: () => {
          setFeedback({
            type: 'success',
            text: `${targetUser.firstName} is now ${pretty(newRole)}.`,
          });
        },
        onError: (err) => {
          setFeedback({ type: 'error', text: getApiError(err) });
        },
      },
    );
  };

  const requestStatusChange = (targetUser) => {
    if (targetUser.id === currentUser.id) {
      setFeedback({
        type: 'error',
        text: 'You cannot suspend or reactivate your own account.',
      });
      return;
    }

    setConfirmTarget(targetUser);
  };

  const confirmStatusChange = () => {
    if (!confirmTarget) return;

    const newStatus =
      confirmTarget.status === 'active' ? 'suspended' : 'active';

    updateStatus.mutate(
      { id: confirmTarget.id, status: newStatus },
      {
        onSuccess: () => {
          setFeedback({
            type: 'success',
            text:
              newStatus === 'suspended'
                ? `${confirmTarget.firstName}'s account was suspended.`
                : `${confirmTarget.firstName}'s account was reactivated.`,
          });
          setConfirmTarget(null);
        },
        onError: (err) => {
          setFeedback({ type: 'error', text: getApiError(err) });
          setConfirmTarget(null);
        },
      },
    );
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-2">
          <UserCog className="w-4 h-4" />
          ADMINISTRATION
        </div>

        <h1 className="text-3xl font-bold text-white">
          User Management
        </h1>

        <p className="text-sm text-slate-400 mt-2">
          Manage platform roles and account status. Permissions are enforced by the backend.
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl p-4 border text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}

            {feedback.text}
          </div>

          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />

            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={role}
            onChange={(e) => setParams({ role: e.target.value, page: 1 })}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {pretty(item)}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setParams({ status: e.target.value, page: 1 })}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {pretty(item)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Platform Users</h2>
          </div>

          {isFetching && !isLoading && (
            <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
          )}
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-sm text-slate-400">
            Loading users...
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-7 h-7 text-rose-400 mx-auto mb-3" />
            <p className="text-sm text-rose-300">
              {error.response?.data?.message || 'Unable to load users.'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-slate-200"
            >
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-sm text-slate-500">
            No users match these filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-950/40 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {users.map((item) => {
                  const initials =
                    `${item.firstName?.[0] || ''}${item.lastName?.[0] || ''}`.toUpperCase();

                  const isCurrentUser = item.id === currentUser.id;
                  const isUpdatingRole =
                    updateRole.isPending && updateRole.variables?.id === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-300 flex items-center justify-center text-xs font-bold border border-indigo-500/20">
                            {initials || 'U'}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-200">
                              {item.firstName} {item.lastName}
                              {isCurrentUser && (
                                <span className="ml-2 text-[10px] text-indigo-400">
                                  (You)
                                </span>
                              )}
                            </p>

                            <p className="text-xs text-slate-500">{item.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-indigo-400" />

                          <select
                            value={item.role}
                            disabled={isCurrentUser || isUpdatingRole}
                            onChange={(e) => handleRoleChange(item, e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 disabled:opacity-50 focus:outline-none focus:border-indigo-500"
                          >
                            {ROLE_OPTIONS.map((roleItem) => (
                              <option key={roleItem} value={roleItem}>
                                {pretty(roleItem)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            item.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {item.status === 'active' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Ban className="w-3 h-3" />
                          )}

                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          disabled={isCurrentUser}
                          onClick={() => requestStatusChange(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${
                            item.status === 'active'
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                        >
                          {item.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 pb-5">
          <Pagination
            meta={meta}
            onPageChange={(newPage) => setParams({ page: newPage })}
          />
        </div>
      </div>

      <ConfirmModal
        open={Boolean(confirmTarget)}
        title={
          confirmTarget?.status === 'active'
            ? 'Suspend user account'
            : 'Activate user account'
        }
        message={
          confirmTarget?.status === 'active'
            ? `Suspend ${confirmTarget?.firstName} ${confirmTarget?.lastName}? They will no longer be able to log in.`
            : `Reactivate ${confirmTarget?.firstName} ${confirmTarget?.lastName}? They will be able to log in again.`
        }
        confirmLabel={
          confirmTarget?.status === 'active' ? 'Suspend Account' : 'Activate Account'
        }
        danger={confirmTarget?.status === 'active'}
        pending={updateStatus.isPending}
        onConfirm={confirmStatusChange}
        onClose={() => setConfirmTarget(null)}
      />
    </div>
  );
}