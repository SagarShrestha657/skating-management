import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Button,
    Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../services/api';

const LoginModal: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();

    const handleLogin = async () => {
        try {
            setError(null);
            const { token } = await apiLogin(password); // Expect token from API
            login(token); // Pass the token to AuthContext
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <Dialog open={true} disableEscapeKeyDown>
            <DialogTitle>Login</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <TextField
                    autoFocus
                    margin="dense"
                    label="Password"
                    type="password"
                    fullWidth
                    variant="standard"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleLogin} variant="contained">Login</Button>
            </DialogActions>
        </Dialog>
    );
};

export default LoginModal;