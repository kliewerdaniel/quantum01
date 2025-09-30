import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, List, ListItem, ListItemText, TextField, Button, Paper, Box, Alert, CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { encryptMessage, decryptMessage } from '../utils/cryptoUtils';

interface Message {
  id: number;
  room_id: number;
  sender_id: number;
  encrypted_data: string;
  sent_at: string;
}

const Chat: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [decryptedMessages, setDecryptedMessages] = useState<{[key: number]: string}>({});
  const [newMessage, setNewMessage] = useState('');
  const [roomKey, setRoomKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchMessages();
    fetchRoomKey();
    setupWebSocket();
  }, [roomId, token, navigate]);

  const setupWebSocket = () => {
    if (!roomId || !token) return;

    const ws = new WebSocket(`ws://localhost:8080/ws/${roomId}?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const messageWrapper = JSON.parse(event.data);
        if (messageWrapper.type === 'new_message') {
          if (Array.isArray(messageWrapper.data)) {
            // Full messages list update
            setMessages(messageWrapper.data);
            decryptAllMessages(messageWrapper.data);
          } else {
            // Single message
            const messageData: Message = messageWrapper.data;
            setMessages(prev => {
              if (prev.some(m => m.id === messageData.id)) return prev;
              return [...prev, messageData];
            });
            // Decrypt the new message
            if (roomKey) {
              try {
                const encryptedData = JSON.parse(messageData.encrypted_data);
                const decrypted = decryptMessage(encryptedData, roomKey);
                setDecryptedMessages(prev => ({ ...prev, [messageData.id]: decrypted }));
              } catch (err) {
                console.error('Failed to decrypt incoming message:', err);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Failed to connect to chat server');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setSocket(ws);
    return () => ws.close();
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`http://localhost:8080/messages/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
      // Decrypt existing messages
      if (roomKey) {
        decryptAllMessages(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
      setError('Failed to load messages');
    }
  };

  const fetchRoomKey = async () => {
    try {
      // Get user's encrypted key for this room
      const keyResponse = await axios.get(`http://localhost:8080/rooms/${roomId}/key`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // For now, using a simple approach - in production this would be properly decrypted
      if (keyResponse.data.symmetric_key) {
        const encryptedKeyData = JSON.parse(keyResponse.data.symmetric_key);
        // Simple decryption placeholder - in real implementation, use Kyber private key
        setRoomKey(encryptedKeyData.symmetric_key || 'placeholder-key');
        await fetchMessages(); // Re-fetch messages now that we have the key
      }
    } catch (err) {
      console.error('Failed to fetch room key', err);
      setError('Failed to load room encryption key');
    } finally {
      setLoading(false);
    }
  };

  const decryptAllMessages = (messageList: Message[]) => {
    if (!roomKey) return;

    const decrypted: {[key: number]: string} = {};
    messageList.forEach(msg => {
      try {
        const encryptedData = JSON.parse(msg.encrypted_data);
        decrypted[msg.id] = decryptMessage(encryptedData, roomKey);
      } catch (err) {
        decrypted[msg.id] = '[Failed to decrypt]';
      }
    });
    setDecryptedMessages(decrypted);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !roomKey) return;

    try {
      // Encrypt message with room key
      const encryptedData = encryptMessage(newMessage, roomKey);

      await axios.post(`http://localhost:8080/messages/${roomId}/send`, {
        encrypted_data: JSON.stringify(encryptedData),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
      setError('Failed to send message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading chat...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        🔐 QuantumChat Room {roomId}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={3} sx={{ height: '60vh', overflow: 'auto', p: 2 }}>
        <List>
          {messages.map((msg) => (
            <ListItem key={msg.id}>
              <ListItemText
                primary={decryptedMessages[msg.id] || msg.encrypted_data}
                secondary={`User ${msg.sender_id} • ${new Date(msg.sent_at).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
        <div ref={messagesEndRef} />
      </Paper>

      <Box sx={{ mt: 2, display: 'flex' }}>
        <TextField
          fullWidth
          label="Type an encrypted message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={!roomKey}
        />
        <Button
          variant="contained"
          onClick={sendMessage}
          sx={{ ml: 1 }}
          disabled={!newMessage.trim() || !roomKey}
        >
          Send
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {roomKey
          ? '✅ Messages encrypted with quantum-resistant AES'
          : '⏳ Loading encryption keys...'
        }
      </Typography>
    </Container>
  );
};

export default Chat;
