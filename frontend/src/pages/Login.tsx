import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Alert, Link } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import keyService from '../services/keyService';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/auth/login', {
        username,
        password,
      });
      localStorage.setItem('token', response.data.access_token);
      // Store password temporarily for key decryption
      localStorage.setItem('userPassword', password);

      // Fetch and decrypt private key
      await loadAndStoreKeys(password, response.data.access_token);

      navigate('/rooms');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  const loadAndStoreKeys = async (password: string, token: string) => {
    const response = await axios.get('http://localhost:8080/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const privateKeyDecrypted = await keyService.loadAndDecryptPrivateKeyFromServer(password, response.data.kyber_private_key_encrypted);
    await keyService.storeUserKeys(password, privateKeyDecrypted, response.data.kyber_public_key);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom>
          QuantumChat Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
          <Typography align="center">
            Not registered?{' '}
            <Link component={RouterLink} to="/register">
              Register here
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
