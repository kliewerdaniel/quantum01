import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, List, ListItem, ListItemText, TextField, Button, Paper, Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';

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
  const [newMessage, setNewMessage] = useState('');
  const [roomKey, setRoomKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMessages();
    fetchRoomKey();
  }, [roomId]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/messages/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  const fetchRoomKey = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/rooms/${roomId}/key`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoomKey(response.data.symmetric_key);
    } catch (err) {
      console.error('Failed to fetch room key', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      // For now, send unencrypted; implement encryption later
      await axios.post(`http://localhost:8000/messages/${roomId}/send`, {
        encrypted_data: newMessage,  // TODO: Encrypt with room key
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>Chat Room {roomId}</Typography>
      <Paper elevation={3} sx={{ height: '60vh', overflow: 'auto', p: 2 }}>
        <List>
          {messages.map((msg) => (
            <ListItem key={msg.id}>
              <ListItemText primary={msg.encrypted_data} secondary={new Date(msg.sent_at).toLocaleString()} />
            </ListItem>
          ))}
        </List>
        <div ref={messagesEndRef} />
      </Paper>
      <Box sx={{ mt: 2, display: 'flex' }}>
        <TextField
          fullWidth
          label="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <Button variant="contained" onClick={sendMessage} sx={{ ml: 1 }}>
          Send
        </Button>
      </Box>
    </Container>
  );
};

export default Chat;
