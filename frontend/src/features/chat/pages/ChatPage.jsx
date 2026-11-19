import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send,
  Users,
  Search,
  MessageCircle,
  Plus,
  X,
  Hash,
  Shield,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useContacts,
  useStartDirectChat,
  chatKeys,
} from '../hooks/useChat';
import { useRealtimeEvent } from '../../realtime/useRealtimeEvent';
import { useQueryClient } from '@tanstack/react-query';
import { formatDateTime } from '../../../utils/dates';
import { getFileUrl } from '../../../utils/files';
import { chatApi } from '../api/chat.api';

export default function ChatPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const convIdFromUrl = searchParams.get('convId');
  const clubIdParam = searchParams.get('clubId');

  const [activeConvId, setActiveConvId] = useState(convIdFromUrl || null);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const messagesEndRef = useRef(null);

  // Queries
  const { data: conversations = [], isLoading: loadingConvs } = useConversations();
  const {
    data: messagesData,
    isLoading: loadingMsgs,
    isError: msgsError,
    error: msgsErrorObj,
  } = useMessages(activeConvId);
  const { data: contacts = [], isLoading: loadingContacts } = useContacts(contactSearch);

  const sendMessageMutation = useSendMessage(activeConvId);
  const startDirectMutation = useStartDirectChat();

  const messages = messagesData?.data ?? [];

  // Helper to change active conversation & persist in URL
  const selectConversation = (id) => {
    setActiveConvId(id);
    setSearchParams({ convId: id });
  };

  // 1. If navigated with ?clubId=xxx, open that club's chat automatically
  useEffect(() => {
    if (clubIdParam) {
      chatApi.getOrCreateClubChat(clubIdParam).then((conv) => {
        if (conv?.id) {
          queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
          selectConversation(conv.id);
        }
      });
    }
  }, [clubIdParam, queryClient]);

  // 2. Select first conversation on initial load if none active and none in URL
  useEffect(() => {
    if (!activeConvId && conversations.length > 0 && !clubIdParam) {
      selectConversation(conversations[0].id);
    }
  }, [conversations, activeConvId, clubIdParam]);

  // 3. Keep state synced with URL if user clicks browser back/forward
  useEffect(() => {
    if (convIdFromUrl && convIdFromUrl !== activeConvId) {
      setActiveConvId(convIdFromUrl);
    }
  }, [convIdFromUrl]);

  // 4. Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 5. REAL-TIME LISTENER: when any message arrives
  useRealtimeEvent('chat.message.received', ({ conversationId, message }) => {
    if (conversationId === activeConvId) {
      queryClient.setQueryData(chatKeys.messages(activeConvId), (old) => {
        if (!old?.data) return { data: [message], meta: {} };
        const exists = old.data.some((m) => m.id === message.id);
        return exists ? old : { ...old, data: [...old.data, message] };
      });
    }
    queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
  });

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConvId) return;

    const content = messageInput.trim();
    setMessageInput('');
    sendMessageMutation.mutate(content);
  };

  const handleStartDirect = (targetUserId) => {
    startDirectMutation.mutate(targetUserId, {
      onSuccess: (conv) => {
        setShowNewChatModal(false);
        selectConversation(conv.id);
      },
    });
  };

  const filteredConversations = conversations.filter((c) => {
    if (filterType === 'direct' && c.type !== 'direct') return false;
    if (filterType === 'club' && c.type !== 'club') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (c.type === 'club') {
        return c.club?.name?.toLowerCase().includes(q);
      } else {
        const name = `${c.otherParticipant?.firstName} ${c.otherParticipant?.lastName}`.toLowerCase();
        return name.includes(q) || c.otherParticipant?.email?.toLowerCase().includes(q);
      }
    }
    return true;
  });

  return (
    <div className="h-[calc(100vh-140px)] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex shadow-2xl">
      {/* ---------------- LEFT PANEL: CONVERSATIONS LIST ---------------- */}
      <div className="w-80 lg:w-96 border-r border-slate-800 flex flex-col bg-slate-950/40 shrink-0">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Campus Messages</h2>
          </div>

          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20"
            title="Start Direct Message"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 pt-3 pb-2 flex gap-1.5">
          {['all', 'direct', 'club'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                filterType === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f === 'club' ? 'Clubs' : f === 'direct' ? 'Direct' : 'All'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {loadingConvs ? (
            <p className="text-xs text-slate-500 text-center py-10">Loading chats...</p>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-xs text-slate-400">No conversations yet.</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="mt-3 text-xs text-indigo-400 font-semibold hover:underline"
              >
                + Send a direct message
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              const isClub = conv.type === 'club';

              const title = isClub
                ? conv.club?.name || 'Club Group'
                : `${conv.otherParticipant?.firstName || 'User'} ${conv.otherParticipant?.lastName || ''}`;

              const avatar = isClub
                ? getFileUrl(conv.club?.image)
                : getFileUrl(conv.otherParticipant?.avatar);

              const initials = isClub
                ? '#'
                : `${conv.otherParticipant?.firstName?.[0] || 'U'}${conv.otherParticipant?.lastName?.[0] || ''}`.toUpperCase();

              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full text-left p-3.5 flex items-center gap-3 transition ${
                    isActive ? 'bg-indigo-600/15 border-l-4 border-indigo-500' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-xs text-indigo-300 shrink-0 overflow-hidden">
                    {avatar ? (
                      <img src={avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                        {isClub && <Hash className="w-3.5 h-3.5 text-indigo-400" />}
                        {title}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-slate-500">
                          {formatDateTime(conv.lastMessage.createdAt).split(',')[1]}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {conv.lastMessage?.content || 'No messages yet.'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ---------------- RIGHT PANEL: ACTIVE CHAT FEED ---------------- */}
      <div className="flex-1 flex flex-col bg-slate-900/60">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                  {activeConversation.type === 'club' ? '#' : <Users className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {activeConversation.type === 'club'
                      ? activeConversation.club?.name
                      : `${activeConversation.otherParticipant?.firstName} ${activeConversation.otherParticipant?.lastName}`}
                  </h3>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {activeConversation.type === 'club'
                      ? `Club Group Chat • ${activeConversation.club?.category}`
                      : `${activeConversation.otherParticipant?.role} • Direct Message`}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Banner if fetch fails */}
            {msgsError && (
              <div className="m-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{msgsErrorObj?.response?.data?.message || 'Failed to load messages from server.'}</span>
              </div>
            )}

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <p className="text-xs text-slate-500 text-center py-10">Loading messages...</p>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 text-slate-500 text-xs">
                  No messages in this chat yet. Start the conversation!
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender?.id === user?.id;

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-semibold text-slate-400">
                          {isMe ? 'You' : `${m.sender?.firstName} ${m.sender?.lastName}`}
                        </span>
                        <span className="text-[9px] text-slate-600">
                          {formatDateTime(m.createdAt).split(',')[1]}
                        </span>
                      </div>

                      <div
                        className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line shadow ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-900/90 flex gap-2">
              <input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={sendMessageMutation.isPending || !messageInput.trim()}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
            <MessageCircle className="w-12 h-12 text-slate-700" />
            <p>Select a conversation or start a new direct message.</p>
          </div>
        )}
      </div>

      {/* ---------------- NEW DIRECT CHAT MODAL ---------------- */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Start Direct Conversation</h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search students, supervisors..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {loadingContacts ? (
                <p className="text-xs text-slate-500 text-center py-6">Searching campus members...</p>
              ) : contacts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No matching campus members found.</p>
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleStartDirect(contact.id)}
                    className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 flex items-center justify-between text-left transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400">{contact.email}</p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                      {contact.role === 'supervisor' ? <Shield className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                      {contact.role}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}