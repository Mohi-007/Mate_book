import { useState, useEffect, useRef } from 'react';
import { chatAPI, authAPI, friendsAPI, API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getInitials, timeAgo, getImageUrl } from '../utils/helpers';

export default function ChatPage() {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef();
  const typingTimeout = useRef();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (activeConv && msg.conversation_id === activeConv.id) {
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      // Update conversation preview
      loadConversations();
    };

    const handleTyping = (data) => {
      setTypingUsers((prev) => ({ ...prev, [data.conversation_id]: data.username }));
    };

    const handleStopTyping = (data) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[data.conversation_id];
        return next;
      });
    };

    const handleMessageSeen = (data) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.message_id ? { ...m, is_seen: true } : m))
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);
    socket.on('message_seen', handleMessageSeen);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
      socket.off('message_seen', handleMessageSeen);
    };
  }, [socket, activeConv]);

  const loadConversations = async () => {
    try {
      const [convRes, friendsRes] = await Promise.all([
        chatAPI.getConversations(),
        friendsAPI.getFriends()
      ]);
      setConversations(convRes.data.conversations);
      setFriends(friendsRes.data.friends);
    } catch (err) {
      console.error(err);
    }
  };

  const openConversation = async (conv) => {
    setActiveConv(conv);
    try {
      const res = await chatAPI.getMessages(conv.id);
      setMessages(res.data.messages);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      // Join room
      socket?.emit('join_conversation', { conversation_id: conv.id });
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    try {
      const res = await chatAPI.sendMessage(activeConv.id, { content: newMessage });
      // Also emit via socket for real-time
      socket?.emit('send_message', {
        conversation_id: activeConv.id,
        content: newMessage,
      });
      setMessages((prev) => [...prev, res.data.message]);
      setNewMessage('');
      socket?.emit('stop_typing', { conversation_id: activeConv.id });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTyping = () => {
    if (!activeConv) return;
    socket?.emit('typing', { conversation_id: activeConv.id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit('stop_typing', { conversation_id: activeConv.id });
    }, 2000);
  };

  const searchUsers = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await authAPI.searchUsers(q);
      setSearchResults(res.data.users.filter((u) => u.id !== user.id));
    } catch (err) {
      console.error(err);
    }
  };

  const startChat = async (otherUserId) => {
    try {
      const res = await chatAPI.createConversation({ user_id: otherUserId });
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === res.data.conversation.id);
        if (exists) return prev;
        return [res.data.conversation, ...prev];
      });
      openConversation(res.data.conversation);
    } catch (err) {
      console.error(err);
    }
  };

  const getConvName = (conv) => {
    if (conv.is_group) return conv.name || 'Group Chat';
    const other = conv.members?.find((m) => m.user_id !== user?.id);
    return other?.user?.username || 'Chat';
  };

  const getConvAvatar = (conv) => {
    if (conv.is_group) return '👥';
    const other = conv.members?.find((m) => m.user_id !== user?.id);
    return other?.user;
  };

  return (
    <div style={{ marginTop: 0 }}>
      <div className={`chat-layout ${activeConv ? 'active-conv-open' : ''}`}>
        {/* Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            💬 Messages
            <button className="btn btn-sm btn-primary" onClick={() => setShowNewChat(!showNewChat)}>
              ✏️ New
            </button>
          </div>

          {showNewChat && (
            <div style={{ padding: 'var(--space-sm)' }}>
              <input
                className="input"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => searchUsers(e.target.value)}
                autoFocus
              />
              {searchResults.map((u) => (
                <div
                  key={u.id}
                  className="chat-contact"
                  onClick={() => startChat(u.id)}
                >
                  <div className="avatar avatar-sm">
                    {u.profile_pic ? (
                      <img src={getImageUrl(u.profile_pic, API_BASE_URL)} alt="" />
                    ) : (
                      getInitials(u.username)
                    )}
                  </div>
                  <span className="font-bold text-sm">{u.username}</span>
                </div>
              ))}
            </div>
          )}

          {conversations.map((conv) => {
            const avatarUser = getConvAvatar(conv);
            return (
              <div
                key={conv.id}
                className={`chat-contact ${activeConv?.id === conv.id ? 'active' : ''}`}
                onClick={() => openConversation(conv)}
              >
                <div className="relative">
                  <div className="avatar avatar-sm">
                    {typeof avatarUser === 'string' ? avatarUser : avatarUser?.profile_pic ? (
                      <img src={getImageUrl(avatarUser.profile_pic, API_BASE_URL)} alt="" />
                    ) : (
                      getInitials(avatarUser?.username)
                    )}
                  </div>
                  {avatarUser && typeof avatarUser !== 'string' && onlineUsers.has(avatarUser.id) && (
                    <div className="online-dot" />
                  )}
                </div>
                <div className="chat-contact-info">
                  <div className="chat-contact-name">{getConvName(conv)}</div>
                  <div className="chat-contact-preview">
                    {conv.last_message?.content || 'No messages yet'}
                  </div>
                </div>
                {conv.unread_count > 0 && (
                  <span className="unread-badge">{conv.unread_count}</span>
                )}
              </div>
            );
          })}

          {/* Contacts (Friends who don't have a conversation yet) */}
          {friends.length > 0 && (
            <>
              <div className="chat-sidebar-header mt-md" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                👥 Contacts
              </div>
              {friends
                .filter(f => !conversations.some(c => c.members.some(m => m.user_id === f.id)))
                .map((f) => (
                  <div
                    key={f.id}
                    className="chat-contact"
                    onClick={() => startChat(f.id)}
                  >
                    <div className="relative">
                      <div className="avatar avatar-sm">
                        {f.profile_pic ? (
                          <img src={getImageUrl(f.profile_pic, API_BASE_URL)} alt="" />
                        ) : (
                          getInitials(f.username)
                        )}
                      </div>
                      {onlineUsers.has(f.id) && <div className="online-dot" />}
                    </div>
                    <div className="chat-contact-info">
                      <div className="chat-contact-name">{f.username}</div>
                      <div className="chat-contact-preview">Start a new chat</div>
                    </div>
                  </div>
                ))}
            </>
          )}

          {conversations.length === 0 && friends.length === 0 && !showNewChat && (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <p className="text-sm text-muted">No conversations yet</p>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="chat-main">
          {activeConv ? (
            <>
              <div className="chat-header">
                <button className="btn btn-sm btn-ghost mobile-back-btn" onClick={() => setActiveConv(null)}>
                  ⬅️
                </button>
                <div className="avatar avatar-sm">
                  {(() => {
                    const av = getConvAvatar(activeConv);
                    if (typeof av === 'string') return av;
                    if (av?.profile_pic) return <img src={getImageUrl(av.profile_pic, API_BASE_URL)} alt="" />;
                    return getInitials(av?.username);
                  })()}
                </div>
                <div>
                  <div className="font-bold">{getConvName(activeConv)}</div>
                  {typingUsers[activeConv.id] && (
                    <div className="text-xs text-muted" style={{ fontStyle: 'italic' }}>
                      {typingUsers[activeConv.id]} is typing...
                    </div>
                  )}
                </div>
              </div>

              <div className="chat-messages">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-bubble ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
                  >
                    {msg.sender_id !== user?.id && (
                      <div className="text-xs font-bold mb-sm" style={{ color: 'var(--blue)' }}>
                        {msg.sender?.username}
                      </div>
                    )}
                    {msg.content}
                    {msg.media_url && (
                      <img
                        src={getImageUrl(msg.media_url, API_BASE_URL)}
                        alt=""
                        style={{ maxWidth: '100%', marginTop: 4, border: '2px solid var(--black)', borderRadius: 'var(--radius)' }}
                      />
                    )}
                    <div className="message-meta">
                      {timeAgo(msg.created_at)}
                      {msg.sender_id === user?.id && msg.is_seen && (
                        <span className="message-seen"> ✓✓</span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-area" onSubmit={sendMessage}>
                <input
                  className="input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                />
                <button className="btn btn-primary btn-sm" type="submit">📤</button>
              </form>
            </>
          ) : (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <div className="empty-state-icon">💬</div>
              <h3>Select a conversation</h3>
              <p className="text-muted">Or start a new one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
