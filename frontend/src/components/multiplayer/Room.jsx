import { motion as m, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { usePreferences } from '../../settings/PreferencesContext.jsx';
import { useAutoScroll } from '../../hooks/useAutoScroll.js';
import { api } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { UserPlus, X } from 'lucide-react';
import RoomHeader from './RoomHeader.jsx';
import ChatMessage from './ChatMessage.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import PlayerCard from './PlayerCard.jsx';

/**
 * Room Component V2 - Modern competitive gaming style UI
 * Monkeytype-inspired layout with enhanced chat and player cards
 */
export default function Room({ 
  room, 
  isHost, 
  onStart, 
  onLeave, 
  messages = [], 
  onSendMessage, 
  chatDisabled, 
  socket,
  typingUsers = [],
  onKickPlayer = null,
  onPromoteHost = null,
  onLockRoom = null,
  onSetSuddenDeathLimit = null,
}) {
  const { user } = usePreferences();
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [friends, setFriends] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState(new Set());
  const [showInviteFriends, setShowInviteFriends] = useState(false);

  const { scrollRef, endRef, scrollToBottom } = useAutoScroll([messages.length]);

  // Load friends and track online status
  useEffect(() => {
    if (!user?.id || !socket) return;

    const loadFriends = async () => {
      try {
        const { data } = await api.get('/api/friends');
        const friendsList = data.friends || [];
        console.log('[Room] Loaded friends:', friendsList.length, friendsList);
        setFriends(friendsList);
      } catch (err) {
        console.error('[Room] Failed to load friends:', err);
        toast.error('Failed to load friends list');
      }
    };

    loadFriends();

    // Request friend status
    socket.emit('friend:status');

    // Listen for friend status updates
    const handleFriendsStatus = ({ online }) => {
      // Ensure all IDs are strings for consistent comparison
      const onlineIds = (online || []).map(id => String(id));
      console.log('[Room] Online friends status:', onlineIds);
      setOnlineFriends(new Set(onlineIds));
    };

    const handleFriendOnline = ({ userId, username }) => {
      setOnlineFriends(prev => new Set([...prev, String(userId)]));
    };

    const handleFriendOffline = ({ userId }) => {
      setOnlineFriends(prev => {
        const next = new Set(prev);
        next.delete(String(userId));
        return next;
      });
    };

    socket.on('friends:status', handleFriendsStatus);
    socket.on('friend:online', handleFriendOnline);
    socket.on('friend:offline', handleFriendOffline);

    return () => {
      socket.off('friends:status', handleFriendsStatus);
      socket.off('friend:online', handleFriendOnline);
      socket.off('friend:offline', handleFriendOffline);
    };
  }, [user?.id, socket]);

  // Invite friend to room
  const handleInviteFriend = (friend) => {
    if (!socket || !room?.code) return;
    
    // Emit invite event (you may need to add this to backend)
    socket.emit('room:invite', {
      code: room.code,
      friendId: friend._id,
      friendUsername: friend.username,
    });
    
    toast.success(`Invited ${friend.username} to join the room!`);
    setShowInviteFriends(false);
  };

  if (!room) return null;

  // Handle typing indicator
  const handleChatInputChange = (value) => {
    setChatInput(value);
    
    // Emit typing event
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      socket?.emit('chat:typing', { code: room.code });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('chat:typing:stop', { code: room.code });
    }, 2000);
  };

  // Cleanup typing on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        socket?.emit('chat:typing:stop', { code: room.code });
      }
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatDisabled) return;

    // Stop typing indicator
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket?.emit('chat:typing:stop', { code: room.code });

    onSendMessage?.(chatInput);
    setChatInput('');
  };

  // Filter out current user from typing users
  const otherTypingUsers = typingUsers.filter(username => username !== user?.username);

  // Sort players: host first, then by name
  const sortedPlayers = [...(room.players || [])].sort((a, b) => {
    if (a.role === 'host') return -1;
    if (b.role === 'host') return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  const showProgress = room.status === 'race';

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full max-w-7xl mx-auto p-4 md:p-6">
      {/* Room Header */}
      <RoomHeader
        room={room}
        isHost={isHost}
        onStart={onStart}
        onLeave={onLeave}
        onLockRoom={onLockRoom}
        onKickPlayer={onKickPlayer}
        onPromoteHost={onPromoteHost}
      />

      {/* Main Content: Chat + Players */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Chat Section (Left, 2/3 width on desktop) */}
        <div className="lg:col-span-2">
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[400px] max-h-[600px]"
          >
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-slate-800/80">
              <h2 className="text-sm font-semibold text-slate-200">Chat</h2>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide"
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <ChatMessage
                    key={idx}
                    message={msg}
                    isOwn={user && msg?.name === user.username}
                    index={idx}
                  />
                ))
              )}
              
              {/* Typing Indicator */}
              <TypingIndicator typingUsers={otherTypingUsers} />
              
              <div ref={endRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="border-t border-slate-800/80 p-3 md:p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => handleChatInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  disabled={chatDisabled}
                  placeholder={chatDisabled ? 'Chat disabled' : 'Type a message...'}
                  className="flex-1 bg-slate-800/90 text-slate-100 border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={chatDisabled || !chatInput.trim()}
                  className="px-4 py-2.5 rounded-lg bg-emerald-600 text-black font-semibold hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-emerald-500/20"
                >
                  Send
                </button>
              </div>
            </form>
          </m.div>
        </div>

        {/* Players Section (Right, 1/3 width on desktop) */}
        <div className="lg:col-span-1">
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800 shadow-lg overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[400px] max-h-[600px]"
          >
            {/* Players Header */}
            <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">
                Players ({sortedPlayers.length})
              </h2>
              {/* Sudden Death Limit Control (Host only, when active) */}
              {isHost && room?.modifiers?.includes('sudden-death') && onSetSuddenDeathLimit && (
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-slate-400">Limit:</label>
                  <select
                    value={room.suddenDeathLimit || 1}
                    onChange={(e) => onSetSuddenDeathLimit(Number(e.target.value))}
                    className="text-xs bg-slate-800/50 text-slate-200 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              )}
              {user && (
                <button
                  onClick={async () => {
                    // Reload friends when opening dropdown to ensure fresh data
                    if (!showInviteFriends) {
                      try {
                        const { data } = await api.get('/api/friends');
                        setFriends(data.friends || []);
                        // Request updated friend status
                        socket?.emit('friend:status');
                      } catch (err) {
                        console.error('[Room] Failed to reload friends:', err);
                      }
                    }
                    setShowInviteFriends(!showInviteFriends);
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors flex items-center gap-1.5"
                  title="Invite Friends"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Invite
                </button>
              )}
            </div>

            {/* Invite Friends Dropdown */}
            <AnimatePresence>
              {showInviteFriends && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-slate-800/80 overflow-hidden"
                >
                  <div className="px-4 py-3 bg-slate-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-300">Invite Friends</span>
                      <button
                        onClick={() => setShowInviteFriends(false)}
                        className="p-1 rounded hover:bg-slate-700 transition-colors"
                        aria-label="Close invite menu"
                      >
                        <X className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-hide">
                      {friends.length === 0 ? (
                        <div className="text-xs text-slate-500 text-center py-4">
                          No friends yet. Add friends to invite them!
                        </div>
                      ) : friends.filter(friend => {
                        // Check if friend is already in room (case-insensitive comparison)
                        const friendUsername = (friend.username || '').toLowerCase().trim();
                        return !sortedPlayers.some(p => {
                          const playerName = (p.name || '').toLowerCase().trim();
                          return playerName === friendUsername;
                        });
                      }).length === 0 ? (
                        <div className="text-xs text-slate-500 text-center py-4">
                          All friends are already in the room
                        </div>
                      ) : (
                        friends
                          .filter(friend => {
                            // Don't show friends who are already in the room (case-insensitive)
                            const friendUsername = (friend.username || '').toLowerCase().trim();
                            return !sortedPlayers.some(p => {
                              const playerName = (p.name || '').toLowerCase().trim();
                              return playerName === friendUsername;
                            });
                          })
                          .map(friend => {
                            // Convert friend._id to string for consistent comparison
                            const friendId = String(friend._id || friend.id || '');
                            const isOnline = onlineFriends.has(friendId);
                            return (
                              <button
                                key={friendId}
                                onClick={() => handleInviteFriend(friend)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-700/50 transition-colors text-left"
                              >
                                <div className="relative">
                                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                    {friend.username?.[0]?.toUpperCase() || 'U'}
                                  </div>
                                  {isOnline && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-slate-200 truncate flex items-center gap-1.5">
                                    {friend.username}
                                    {isOnline && (
                                      <span className="text-[10px] text-emerald-400">●</span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                      )}
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>

            {/* Players List */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 scrollbar-hide">
              {sortedPlayers.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  No players
                </div>
              ) : (
                sortedPlayers.map((player, idx) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    isHost={isHost}
                    isMe={user && player.name === user.username}
                    showProgress={showProgress}
                    onKick={onKickPlayer}
                    onPromote={onPromoteHost}
                    onSetTeam={(playerId, team) => {
                      if (!socket || !room?.code) return;
                      socket.emit('room:setTeam', { code: room.code, playerId, team }, (resp) => {
                        if (resp?.error) {
                          console.error('Set team error:', resp.error);
                        }
                      });
                    }}
                    teamMode={room?.teamMode || false}
                    index={idx}
                  />
                ))
              )}
            </div>
          </m.div>
        </div>
      </div>

      {/* Waiting Message (Non-host in lobby) */}
      {!isHost && room.status === 'lobby' && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center text-slate-400 text-sm"
        >
          ⏳ Waiting for host to start the game...
        </m.div>
      )}
    </div>
  );
}
