import { useState, useEffect } from 'react';
import { friendsAPI, API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getInitials } from '../utils/helpers';
import { Link } from 'react-router-dom';

export default function FriendsPage() {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('friends');

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  const loadFriends = async () => {
    try {
      const res = await friendsAPI.getFriends(user?.id);
      setFriends(res.data.friends);
    } catch (err) { console.error(err); }
  };

  const loadRequests = async () => {
    try {
      const res = await friendsAPI.getPendingRequests();
      setRequests(res.data.requests);
    } catch (err) { console.error(err); }
  };

  const acceptRequest = async (friendshipId) => {
    try {
      await friendsAPI.acceptRequest(friendshipId);
      loadFriends();
      loadRequests();
    } catch (err) { console.error(err); }
  };

  const declineRequest = async (friendshipId) => {
    try {
      await friendsAPI.declineRequest(friendshipId);
      loadRequests();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 'var(--space-md)' }}>
      <h1 className="mb-lg">👥 Friends</h1>

      <div className="flex gap-xs mb-lg">
        <button className={`tag ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>
          Friends ({friends.length})
        </button>
        <button className={`tag ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
          Requests ({requests.length})
        </button>
      </div>

      {tab === 'friends' && (
        <div className="stagger">
          {friends.map((friend) => (
            <div key={friend.id} className="card-flat flex items-center gap-md mb-sm" style={{ padding: 12 }}>
              <div className="relative">
                <div className="avatar">
                  {friend.profile_pic ? (
                    <img src={`${API_BASE_URL}${friend.profile_pic}`} alt="" />
                  ) : (
                    getInitials(friend.username)
                  )}
                </div>
                {onlineUsers.has(friend.id) && <div className="online-dot" />}
              </div>
              <div style={{ flex: 1 }}>
                <Link to={`/profile/${friend.id}`} style={{ color: 'var(--text)' }}>
                  <strong>{friend.username}</strong>
                </Link>
                {friend.mood && <span style={{ marginLeft: 8 }}>{friend.mood}</span>}
              </div>
              <span className={`text-xs font-bold ${onlineUsers.has(friend.id) ? '' : 'text-muted'}`}>
                {onlineUsers.has(friend.id) ? '🟢 Online' : '⚫ Offline'}
              </span>
            </div>
          ))}
          {friends.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <p className="text-muted">No friends yet. Start connecting!</p>
            </div>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="stagger">
          {requests.map((r) => (
            <div key={r.id} className="card-flat flex items-center gap-md mb-sm" style={{ padding: 12 }}>
              <div className="avatar">
                {r.requester.profile_pic ? (
                  <img src={`${API_BASE_URL}${r.requester.profile_pic}`} alt="" />
                ) : (
                  getInitials(r.requester.username)
                )}
              </div>
              <div style={{ flex: 1 }}>
                <strong>{r.requester.username}</strong>
                <div className="text-xs text-muted">wants to be your friend</div>
              </div>
              <div className="flex gap-xs">
                <button className="btn btn-sm btn-green" onClick={() => acceptRequest(r.id)}>
                  ✅ Accept
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => declineRequest(r.id)}>
                  ✕
                </button>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📬</div>
              <p className="text-muted">No pending requests</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
