import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, List, ListItem, ListItemText, ListItemButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Room {
  id: number;
  name: string;
}

const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [createDialog, setCreateDialog] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('http://localhost:8000/rooms/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(response.data);
    } catch (err) {
      setError('Failed to load rooms');
    }
  };

  const handleCreateRoom = async () => {
    try {
      await axios.post('http://localhost:8100/rooms/', { name: roomName }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCreateDialog(false);
      setRoomName('');
      fetchRooms();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create room');
    }
  };

  const handleRoomClick = (roomId: number) => {
    navigate(`/chat/${roomId}`);
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>QuantumChat Rooms</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Button variant="contained" onClick={() => setCreateDialog(true)} sx={{ mb: 2 }}>
        Create New Room
      </Button>
      <List>
        {rooms.map((room) => (
          <ListItem key={room.id}>
            <ListItemButton onClick={() => handleRoomClick(room.id)}>
              <ListItemText primary={room.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)}>
        <DialogTitle>Create Room</DialogTitle>
        <DialogContent>
          <TextField
            label="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateRoom}>Create</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Rooms;
