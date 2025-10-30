import React, { useState } from 'react';
import {
    TextField,
    Button,
    Paper,
    Typography,
    Box,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const LoginModal: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login({ username, password });
        } catch (err) {
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.50',
            }}
        >
            <Paper
                elevation={6}
                sx={{
                    p: { xs: 3, md: 5 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: 450,
                    width: '90%',
                    borderRadius: 4,
                }}
            >
                <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    🛼 Skate Park Login
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Select your account and enter the password.
                </Typography>

                <form onSubmit={handleLogin} style={{ width: '100%' }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id="username-select-label">Select User</InputLabel>
                        <Select
                            labelId="username-select-label"
                            value={username}
                            label="Select User"
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        >
                            <MenuItem value="area1_owner">Area 1 (Owner)</MenuItem>
                            <MenuItem value="area1_staff">Area 1 (Staff)</MenuItem>
                            <MenuItem value="area2_owner">Area 2 (Owner)</MenuItem>
                            <MenuItem value="area2_staff">Area 2 (Staff)</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField margin="normal" required fullWidth name="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} />

                    {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, py: 1.5, fontSize: '1rem' }}>
                        Login
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default LoginModal;