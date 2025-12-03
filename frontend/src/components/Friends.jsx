// ============================================
// Friends Component - Friend System V2
// ============================================

import { useState, useEffect, useRef } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { usePreferences } from '../settings/PreferencesContext.jsx';
import { toast } from 'react-hot-toast';
import { Search, UserPlus, Check, X, UserMinus, Shield, ShieldOff, Users, User, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { AVATAR_EMOJI } from '../utils/avatars.js';
import { formatTimeAgo } from '../utils/formatters.js';

export default function Friends({ onClose, onSelectFriend }) {
  const { user } = usePreferences();
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'requests' | 'search'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'friends') {
      loadFriends();
    } else if (activeTab === 'requests') {
      loadRequests();
    }
  }, [activeTab]);

  async function loadFriends() {
    try {
      setLoading(true);
      const { data } = await api.get('/api/friends');
      setFriends(data.friends || []);
    } catch (err) {
      console.error('[Friends] Load error:', err);
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  }

  async function loadRequests() {
    try {
      setLoading(true);
      const { data } = await api.get('/api/friends/requests');
      setRequests({
        received: data.received || [],
        sent: data.sent || [],
      });
    } catch (err) {
      console.error('[Friends] Load requests error:', err);
      toast.error('Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast.error('Search query must be at least 2 characters');
      return;
    }

    try {
      setSearchLoading(true);
      console.log('[Friends] Searching for:', searchQuery);
      const { data } = await api.post('/api/friends/search', { query: searchQuery });
      console.log('[Friends] Search results:', data);
      setSearchResults(data.users || []);
      if (data.users && data.users.length === 0) {
        toast.error('No users found');
      }
    } catch (err) {
      console.error('[Friends] Search error:', err);
      console.error('[Friends] Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        config: err?.config,
      });
      const errorMsg = err?.response?.data?.error || err?.message || 'Failed to search users';
      toast.error(errorMsg);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  async function sendRequest(userId) {
    try {
      await api.post('/api/friends/send', { userId });
      toast.success('Friend request sent');
      handleSearch(); // Refresh search results
      loadRequests(); // Refresh requests
    } catch (err) {
      const errorMsg = err?.response?.data?.error || 'Failed to send request';
      toast.error(errorMsg);
    }
  }

  async function acceptRequest(requestId) {
    try {
      await api.post('/api/friends/accept', { requestId });
      toast.success('Friend request accepted');
      loadRequests();
      loadFriends();
    } catch (err) {
      const errorMsg = err?.response?.data?.error || 'Failed to accept request';
      toast.error(errorMsg);
    }
  }

  async function declineRequest(requestId) {
    try {
      await api.post('/api/friends/decline', { requestId });
      toast.success('Friend request declined');
      loadRequests();
    } catch (err) {
      const errorMsg = err?.response?.data?.error || 'Failed to decline request';
      toast.error(errorMsg);
    }
  }

  async function removeFriend(userId) {
    try {
      await api.post('/api/friends/remove', { userId });
      toast.success('Friend removed');
      loadFriends();
    } catch (err) {
      const errorMsg = err?.response?.data?.error || 'Failed to remove friend';
      toast.error(errorMsg);
    }
  }

  // Auto-search on typing (debounced)
  useEffect(() => {
    if (activeTab === 'search' && searchQuery.trim().length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        handleSearch();
      }, 500);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, activeTab]);

  function getAvatar(user, size = 'md', showOnline = false) {
    const sizeClasses = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-12 h-12 text-base',
      lg: 'w-16 h-16 text-xl',
    };
    const sizeClass = sizeClasses[size] || sizeClasses.md;
    
    // Priority: avatarUrl > avatarChoice emoji > initials (OAuth users use initials)
    if (user.avatarUrl || user.preferences?.avatarUrl) {
      return (
        <div className="relative">
          <img 
            src={user.avatarUrl || user.preferences?.avatarUrl} 
            alt={user.username} 
            className={`${sizeClass} rounded-full object-cover border-2 border-slate-700`} 
          />
          {showOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
          )}
        </div>
      );
    }
    
    const avatarChoice = user.avatarChoice || user.preferences?.avatarChoice;
    if (avatarChoice && AVATAR_EMOJI[avatarChoice]) {
      return (
        <div className="relative">
          <div className={`${sizeClass} rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center`}>
            <span className="text-lg">{AVATAR_EMOJI[avatarChoice]}</span>
          </div>
          {showOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
          )}
        </div>
      );
    }
    
    // Fallback to initials
    return (
      <div className="relative">
        <div className={`${sizeClass} rounded-full bg-gradient-to-br from-emerald-500/30 to-blue-500/30 border-2 border-slate-700 flex items-center justify-center font-bold text-slate-200`}>
          {user.username?.[0]?.toUpperCase() || 'U'}
        </div>
        {showOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
        )}
      </div>
    );
  }

  // Loading skeleton component
  const FriendSkeleton = () => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 animate-pulse">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-12 h-12 rounded-full bg-slate-700" />
        <div className="flex-1">
          <div className="h-4 w-32 bg-slate-700 rounded mb-2" />
          <div className="h-3 w-48 bg-slate-700 rounded" />
        </div>
      </div>
      <div className="w-20 h-8 bg-slate-700 rounded-lg" />
    </div>
  );

  // Render tabs and content (shared between modal and page)
  const renderTabsAndContent = () => (
    <>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 sm:mb-8 p-1 bg-slate-900/50 rounded-xl border border-slate-800/50">
        {[
          { key: 'friends', label: 'Friends', count: friends.length, icon: Users },
          { key: 'requests', label: 'Requests', count: (requests.received?.length || 0) + (requests.sent?.length || 0), icon: UserPlus },
          { key: 'search', label: 'Search', icon: Search },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all relative rounded-lg ${
                activeTab === tab.key
                  ? 'text-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full font-semibold ${
                  activeTab === tab.key
                    ? 'bg-emerald-500/30 text-emerald-300'
                    : 'bg-slate-700/50 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className={`flex-1 ${onClose ? 'min-h-0' : ''}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'friends' && (
            <m.div
              key="friends"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <FriendSkeleton key={i} />)}
                </div>
              ) : friends.length === 0 ? (
                <m.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16 px-4"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 flex items-center justify-center">
                    <Users className="w-12 h-12 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">No friends yet</h3>
                  <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                    Start building your typing community! Search for users and send friend requests.
                  </p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-semibold transition-all hover:scale-105 flex items-center gap-2 mx-auto"
                  >
                    <Search className="w-4 h-4" />
                    Search Users
                  </button>
                </m.div>
              ) : (
                <div className="grid gap-2 sm:gap-3">
                  {friends.map((friend, idx) => (
                    <m.div
                      key={friend._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group flex items-center justify-between p-3 sm:p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800/70 hover:border-emerald-500/30 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
                    >
                      <Link
                        to={`/profile/${friend.username}`}
                        className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                      >
                        {getAvatar(friend, 'sm', false)}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-100 mb-0.5 sm:mb-1 flex items-center gap-2 text-sm sm:text-base">
                            {friend.username}
                          </div>
                          <div className="text-[10px] sm:text-xs text-slate-400 truncate">{friend.email}</div>
                        </div>
                      </Link>
                      <div className="flex items-center gap-1 sm:gap-2">
                        {onSelectFriend && (
                          <button
                            onClick={() => onSelectFriend(friend)}
                            className="px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all hover:scale-105 font-medium"
                          >
                            Invite
                          </button>
                        )}
                        <Link
                          to={`/profile/${friend.username}`}
                          className="p-1.5 sm:p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-all hover:scale-110"
                          title="View Profile"
                        >
                          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                        </Link>
                        <button
                          onClick={() => removeFriend(friend._id)}
                          className="p-1.5 sm:p-2 rounded-lg bg-slate-700/50 hover:bg-red-500/20 transition-all hover:scale-110 group/remove"
                          title="Remove friend"
                        >
                          <UserMinus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover/remove:text-red-400 transition-colors" />
                        </button>
                      </div>
                    </m.div>
                  ))}
                </div>
              )}
            </m.div>
          )}

          {activeTab === 'requests' && (
            <m.div
              key="requests"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <FriendSkeleton key={i} />)}
                </div>
              ) : (
                <>
                  {/* Received Requests */}
                  {requests.received?.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Received Requests</h3>
                        <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                          {requests.received.length}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {requests.received.map((req, idx) => (
                          <m.div
                            key={req._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
                          >
                            <Link
                              to={`/profile/${req.user.username}`}
                              className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                            >
                              {getAvatar(req.user, 'md')}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-slate-100 mb-1">{req.user.username}</div>
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTimeAgo(req.createdAt)}
                                </div>
                              </div>
                            </Link>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => acceptRequest(req._id)}
                                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                title="Accept"
                              >
                                <Check className="w-4 h-4" />
                                Accept
                              </button>
                              <button
                                onClick={() => declineRequest(req._id)}
                                className="p-2 rounded-lg bg-slate-700/50 hover:bg-red-500/20 transition-all hover:scale-110"
                                title="Decline"
                              >
                                <X className="w-4 h-4 text-slate-400 hover:text-red-400 transition-colors" />
                              </button>
                            </div>
                          </m.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sent Requests */}
                  {requests.sent?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-5 bg-slate-500 rounded-full" />
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Sent Requests</h3>
                        <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-slate-700/50 text-slate-400 font-medium">
                          {requests.sent.length}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {requests.sent.map((req, idx) => (
                          <m.div
                            key={req._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-all"
                          >
                            <Link
                              to={`/profile/${req.user.username}`}
                              className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                            >
                              {getAvatar(req.user, 'md')}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-slate-100 mb-1">{req.user.username}</div>
                                <div className="text-xs text-slate-400">Waiting for response</div>
                              </div>
                            </Link>
                            <div className="px-4 py-2 text-xs rounded-lg bg-slate-700/50 text-slate-400 font-medium flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Pending
                            </div>
                          </m.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {requests.received?.length === 0 && requests.sent?.length === 0 && (
                    <m.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-16 px-4"
                    >
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 flex items-center justify-center">
                        <UserPlus className="w-12 h-12 text-slate-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-300 mb-2">No friend requests</h3>
                      <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                        You don't have any pending friend requests. Search for users to send requests!
                      </p>
                      <button
                        onClick={() => setActiveTab('search')}
                        className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-semibold transition-all hover:scale-105 flex items-center gap-2 mx-auto"
                      >
                        <Search className="w-4 h-4" />
                        Search Users
                      </button>
                    </m.div>
                  )}
                </>
              )}
            </m.div>
          )}

          {activeTab === 'search' && (
            <m.div
              key="search"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Search Input */}
              <div className="relative mb-6">
                <div className="flex gap-3">
                  <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search by username or email..."
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border-2 border-slate-700/50 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={searchLoading || !searchQuery.trim()}
                    className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {searchLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Search
                      </>
                    )}
                  </button>
                </div>
                {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
                  <p className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                    <span>Type at least 2 characters to search</span>
                  </p>
                )}
              </div>

              {/* Search Results */}
              {searchLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <FriendSkeleton key={i} />)}
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-slate-400 mb-2">
                    Found {searchResults.length} {searchResults.length === 1 ? 'user' : 'users'}
                  </div>
                  {searchResults.map((user, idx) => (
                    <m.div
                      key={user._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800/70 hover:border-emerald-500/30 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
                    >
                      <Link
                        to={`/profile/${user.username}`}
                        className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                      >
                        {getAvatar(user, 'md')}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-100 mb-1">{user.username}</div>
                          <div className="text-xs text-slate-400 truncate">{user.email}</div>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        {user.status === 'accepted' && (
                          <span className="px-4 py-2 text-xs rounded-lg bg-emerald-500/20 text-emerald-400 font-medium flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            Friends
                          </span>
                        )}
                        {user.status === 'pending' && (
                          <span className="px-4 py-2 text-xs rounded-lg bg-slate-700/50 text-slate-400 font-medium flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Pending
                          </span>
                        )}
                        {user.status === 'blocked' && (
                          <span className="px-4 py-2 text-xs rounded-lg bg-red-500/20 text-red-400 font-medium">
                            Blocked
                          </span>
                        )}
                        {!user.status && (
                          <button
                            onClick={() => sendRequest(user._id)}
                            className="px-4 py-2 text-xs rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all hover:scale-105 font-medium flex items-center gap-1.5"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Add Friend
                          </button>
                        )}
                        <Link
                          to={`/profile/${user.username}`}
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-all hover:scale-110"
                          title="View Profile"
                        >
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                        </Link>
                      </div>
                    </m.div>
                  ))}
                </div>
              ) : searchQuery.trim().length >= 2 && !searchLoading ? (
                <m.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16 px-4"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 flex items-center justify-center">
                    <Search className="w-12 h-12 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">No users found</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    Try searching with a different username or email address.
                  </p>
                </m.div>
              ) : null}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );

  // If used as a page (no onClose), render full page layout
  if (!onClose) {
    return (
      <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 w-full flex flex-col">
        {renderTabsAndContent()}
      </div>
    );
  }

  // Modal/dropdown version
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 w-[90vw] sm:w-[500px] max-h-[60vh] overflow-y-auto scrollbar-hide flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-400" />
          Friends
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        )}
      </div>

      {renderTabsAndContent()}
    </m.div>
  );
}

