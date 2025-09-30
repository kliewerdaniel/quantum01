import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, List, ListItem, ListItemText, TextField, Button, Paper, Box, Alert, CircularProgress, Chip } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import keyService from '../services/keyService';
import { QuantumCrypto } from '../utils/cryptoUtils';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [encryptionPreview, setEncryptionPreview] = useState<string>('');
  const [hasRoomKey, setHasRoomKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const numericRoomId = roomId ? parseInt(roomId) : 0;

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      initializeChat();
    }
  }, [roomId, token, navigate]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      // Load user keys if not already loaded
      const password = localStorage.getItem('userPassword');
      if (password && !keyService.hasKeys()) {
        await keyService.loadUserKeys(password);
      }

      await Promise.all([
        fetchMessages(),
        loadRoomKey()
      ]);

      setupWebSocket();
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setError('Failed to initialize encryption');
    } finally {
      setLoading(false);
    }
  };

  const loadRoomKey = async () => {
    try {
      await keyService.getRoomKey(numericRoomId);
      setHasRoomKey(true);
    } catch (error) {
      console.error('Failed to load room key:', error);
      setError('Failed to load room encryption key');
      setHasRoomKey(false);
    }
  };

  const setupWebSocket = () => {
    if (!roomId || !token) return;

    const ws = new WebSocket(`ws://localhost:8080/ws/${roomId}?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = async (event) => {
      try {
        const messageWrapper = JSON.parse(event.data);
        if (messageWrapper.type === 'new_message') {
          if (Array.isArray(messageWrapper.data)) {
            // Full messages list update
            setMessages(messageWrapper.data);
            await decryptAllMessages(messageWrapper.data);
          } else {
            // Single message
            const messageData: Message = messageWrapper.data;
            setMessages(prev => {
              if (prev.some(m => m.id === messageData.id)) return prev;
              return [...prev, messageData];
            });
            // Decrypt the new message
            if (hasRoomKey) {
              try {
                const decrypted = await keyService.decryptMessage(messageData.encrypted_data, numericRoomId);
                setDecryptedMessages(prev => ({ ...prev, [messageData.id]: decrypted }));
              } catch (err) {
                console.error('Failed to decrypt incoming message:', err);
                setDecryptedMessages(prev => ({ ...prev, [messageData.id]: '[Failed to decrypt]' }));
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
      if (hasRoomKey) {
        await decryptAllMessages(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
      setError('Failed to load messages');
    }
  };

  const decryptAllMessages = async (messageList: Message[]) => {
    const decrypted: {[key: number]: string} = {};
    for (const msg of messageList) {
      try {
        const decryptedText = await keyService.decryptMessage(msg.encrypted_data, numericRoomId);
        decrypted[msg.id] = decryptedText;
      } catch (err) {
        decrypted[msg.id] = '[Failed to decrypt]';
      }
    }
    setDecryptedMessages(decrypted);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !hasRoomKey) return;

    try {
      // Encrypt message with room key
      const encryptedData = await keyService.encryptMessage(newMessage, numericRoomId);

      await axios.post(`http://localhost:8080/messages/${roomId}/send`, {
        encrypted_data: encryptedData,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNewMessage('');
      // Update encryption preview
      updateEncryptionPreview(newMessage);
    } catch (err) {
      console.error('Failed to send message', err);
      setError('Failed to send message');
    }
  };

  const updateEncryptionPreview = async (text: string) => {
    if (!text.trim() || !hasRoomKey) {
      setEncryptionPreview('');
      return;
    }

    try {
      const encrypted = await keyService.encryptMessage(text, numericRoomId);
      const preview = encrypted.substring(0, 50) + (encrypted.length > 50 ? '...' : '');
      setEncryptionPreview(`Encrypted: ${preview}`);
    } catch (error) {
      setEncryptionPreview('Encryption failed');
    }
  };

  // Update preview when typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateEncryptionPreview(newMessage);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [newMessage, hasRoomKey]);

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

      <Box sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="Type an encrypted message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={!hasRoomKey}
          helperText={encryptionPreview}
        />
        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {hasRoomKey
              ? '✅ Messages encrypted with quantum-resistant AES-GCM'
              : '⏳ Loading encryption keys...'
            }
          </Typography>
          <Chip
            label={hasRoomKey ? 'Secure' : 'Loading...'}
            color={hasRoomKey ? 'success' : 'warning'}
            size="small"
          />
        </Box>
        <Button
          variant="contained"
          onClick={sendMessage}
          sx={{ mt: 1, width: '100%' }}
          disabled={!newMessage.trim() || !hasRoomKey}
          fullWidth
        >
          Send Encrypted Message
        </Button>
      </Box>
    </Container>
  );
};

export default Chat;
