import React, { useState, useEffect, useCallback, } from 'react';
import {
    Typography,
    type SelectChangeEvent,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    IconButton,
    Alert,
    Snackbar,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Box,
    Button,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { Link } from 'react-router-dom';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    Analytics as AnalyticsIcon,
    NotificationsActive as NotificationsActiveIcon,
    VolumeUp as VolumeUpIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Check as CheckIcon,
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext';
import { subscribeUserToPush } from '../utils/pushNotifications';
import { type UserSession, getActiveSessions, createSession, deleteSession, editSession, deleteSessionPermanently } from '../services/api';


const SkatingManagement: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const { role, logout } = useAuth();
    const [userSessions, setUserSessions] = useState<UserSession[]>([]);
    const [userName, setUserName] = useState('');
    const [selectedHours, setSelectedHours] = useState<number>(1);
    const [quantity, setQuantity] = useState(1);
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string }>({ open: false, message: '' });

    // State for dialogs
    const [addSessionDialogOpen, setAddSessionDialogOpen] = useState(false);
    const [editSessionDialogOpen, setEditSessionDialogOpen] = useState(false);
    const [sessionToEdit, setSessionToEdit] = useState<UserSession | null>(null);
    const [completeConfirmDialogOpen, setCompleteConfirmDialogOpen] = useState(false);
    const [sessionToComplete, setSessionToComplete] = useState<string | null>(null);
    const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    //const [notificationCounts, setNotificationCounts] = useState<Record<string, number>>({});
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>();
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false); // To track if user has interacted for audio
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    // Pricing configuration
    const pricingConfig: Record<number, number> = {
        0.5: 50,   // Half hour
        1: 100,    // 1 hour
        1.5: 150,  // 1.5 hours
        2: 200,    // 2 hours
        2.5: 250,  // 2.5 hours
        3: 300,    // 3 hours
        3.5: 350,  // 3.5 hours
        4: 400     // 4 hours
    };

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getActiveSessions();
            const now = new Date();

            // Sort sessions by the nearest end time, whether past or future.
            const sortedSessions = response.sessions.sort((a, b) => {
                const endTimeA = new Date(a.endTime!).getTime();
                const endTimeB = new Date(b.endTime!).getTime();
                const nowTime = now.getTime();

                const aIsPast = endTimeA < nowTime;
                const bIsPast = endTimeB < nowTime;

                // Group past sessions at the top
                if (aIsPast && !bIsPast) return -1;
                if (!aIsPast && bIsPast) return 1;

                // For sessions in the same group (both past or both future), sort by end time
                return endTimeA - endTimeB;
            });
            setUserSessions(sortedSessions);
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to fetch sessions.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    // Effect to load and set speech synthesis voices
    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length === 0) return; // Voices not ready

            setVoices(availableVoices);

            const savedVoiceURI = localStorage.getItem('selectedVoiceURI');
            const savedVoice = availableVoices.find(v => v.voiceURI === savedVoiceURI);

            if (savedVoice) {
                setSelectedVoiceURI(savedVoice.voiceURI);
            } else {
                // If no saved voice, find a default, prioritize Nepali
                const defaultVoice = availableVoices.find(v => v.lang === 'ne-NP') || availableVoices.find(v => v.lang === 'en-US') || availableVoices[0];
                setSelectedVoiceURI(defaultVoice.voiceURI);
                localStorage.setItem('selectedVoiceURI', defaultVoice.voiceURI); // Save the default
            }
        };

        // Voices are loaded asynchronously
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices(); // Initial call in case they are already loaded
    }, []);

    // Get current price based on selected hours
    const getCurrentPrice = () => {
        return pricingConfig[selectedHours as keyof typeof pricingConfig] || 0;
    };

    // Calculate total amount
    const getTotalAmount = () => {
        return getCurrentPrice() * quantity;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userName.trim()) {
            setSnackbar({ open: true, message: 'User name is required.' });
            return;
        }

        try {
            await createSession({
                name: userName,
                hours: selectedHours,
                quantity: quantity,
                totalAmount: getTotalAmount(),
            });
            setSnackbar({ open: true, message: 'Session created successfully!' });
            // Reset form
            setUserName('');
            setSelectedHours(0.5);
            setQuantity(1);
            // Refresh session list
            setAddSessionDialogOpen(false); // Close the dialog on success
            fetchSessions();
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to create session.' });
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessionToEdit || !sessionToEdit.name.trim()) {
            setSnackbar({ open: true, message: 'User name is required.' });
            return;
        }

        try {
            await editSession(sessionToEdit._id!, {
                name: sessionToEdit.name,
                hours: sessionToEdit.hours,
                quantity: sessionToEdit.quantity,
                totalAmount: pricingConfig[sessionToEdit.hours as keyof typeof pricingConfig] * sessionToEdit.quantity,
            });
            setSnackbar({ open: true, message: 'Session updated successfully!' });
            setEditSessionDialogOpen(false);
            setSessionToEdit(null);
            fetchSessions();
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to update session.' });
        }
    };

    // Format time for display
    const formatTime = (date: Date | string | undefined): string => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kathmandu' // Ensure time is formatted for Nepal timezone
        });
    };

    // --- Dialog Handlers ---

    const handleOpenEditDialog = (session: UserSession) => {
        setSessionToEdit(session);
        setEditSessionDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setEditSessionDialogOpen(false);
        setSessionToEdit(null);
    };

    // Opens the confirmation dialog
    const handleOpenCompleteConfirmDialog = (id: string) => {
        setSessionToComplete(id);
        setCompleteConfirmDialogOpen(true);
    };

    // Closes the confirmation dialog
    const handleCloseCompleteConfirmDialog = () => {
        setSessionToComplete(null);
        setCompleteConfirmDialogOpen(false);
    };

    const handleOpenDeleteConfirmDialog = (id: string) => {
        setSessionToDelete(id);
        setDeleteConfirmDialogOpen(true);
    };

    const handleCloseDeleteConfirmDialog = () => {
        setSessionToDelete(null);
        setDeleteConfirmDialogOpen(false);
    };

    // Handles the actual session completion after confirmation
    const handleConfirmComplete = async () => {
        if (!sessionToComplete) return;

        const completedSessionId = sessionToComplete;

        try {
            await deleteSession(completedSessionId);
            setSnackbar({ open: true, message: 'Session marked as complete!' })

            fetchSessions();
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to complete session.' });
        } finally {
            handleCloseCompleteConfirmDialog();
        }
    };

    const handleConfirmDelete = async () => {
        if (!sessionToDelete) return;

        try {
            await deleteSessionPermanently(sessionToDelete);
            setSnackbar({ open: true, message: 'Session permanently deleted!' });
            fetchSessions();
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to delete session.' });
        } finally {
            handleCloseDeleteConfirmDialog();
        }
    };

    // Handles the manual announcement for a specific session
    const handleAnnounce = (session: UserSession) => {
        // Cancel any ongoing speech to prioritize the manual announcement
        window.speechSynthesis.cancel();

        const nepaliHoursMap: Record<number, string> = {
            0.5: 'आधा घण्टाको',
            1: 'एक घण्टाको',
            1.5: 'डेढ घण्टाको',
            2: 'दुई घण्टाको',
            2.5: 'साढे दुई घण्टाको',
            3: 'तीन घण्टाको',
            3.5: 'साढे तीन घण्टाको',
            4: 'चार घण्टाको',
        };

        const durationText = nepaliHoursMap[session.hours as keyof typeof nepaliHoursMap] || `${session.hours} घण्टाको`;
        const name = session.name;

        const message = `कृपया ध्यान दिनुहोस् ${name}, तपाईंको ${durationText} समय समाप्त भएको छ, फेरि आउनुहोला।`;

        const utterance = new SpeechSynthesisUtterance(
            message
        );
        utterance.rate = 0.9;
        utterance.pitch = 0.8;
        const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        window.speechSynthesis.speak(utterance);
    };

    const handleVoiceChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        const newVoiceURI = event.target.value as string;
        setSelectedVoiceURI(newVoiceURI);
        localStorage.setItem('selectedVoiceURI', newVoiceURI);
    };

    const handleEnableNotifications = async () => {
        const success = await subscribeUserToPush();
        if (success) {
            setSnackbar({ open: true, message: 'Push notifications have been enabled!' });
            setNotificationPermission('granted');
        } else {
            setSnackbar({ open: true, message: 'Could not enable push notifications. Please check your browser settings.' });
            setNotificationPermission(Notification.permission); // Re-check permission status
        }
    };

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));



    return (
        <Box sx={{ minHeight: '100vh', minWidth: '100vw', bgcolor: 'grey.50', py: 2 }} >
            <div className="w-full h-full mx-auto px-4">
                {/* Header */}
                <Paper sx={{ p: { xs: 2, md: 4 }, mb: 4, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 4, boxShadow: 6 }}>
                    <div>
                        <Typography variant="h3" className="font-bold mb-4 text-center">
                            🛼 Skating Management System
                        </Typography>
                        <Typography variant="h5" className="text-center opacity-90">
                            Manage user sessions
                        </Typography>
                    </div>
                </Paper>
                {/* Main Content Area */}
                <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, boxShadow: 6, minWidth: 870 }}>
                    {'PushManager' in window && notificationPermission === 'default' && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                startIcon={<NotificationsActiveIcon />}
                                onClick={handleEnableNotifications}
                            >
                                Enable Alerts
                            </Button>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 2 }}>

                        <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 'bold' }}>
                            Active ({userSessions.length})
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            {voices.length > 0 && (

                                <FormControl size="small" sx={{ minWidth: 150, maxWidth: 220 }}>
                                    <InputLabel>Voice</InputLabel>
                                    <Select
                                        value={selectedVoiceURI || ''}
                                        label="Voice"
                                        onChange={handleVoiceChange as (event: SelectChangeEvent<string>) => void}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    maxHeight: 250, // Make the dropdown scrollable
                                                },
                                            },
                                        }}
                                    >
                                        {voices.map((voice) => (
                                            <MenuItem
                                                key={voice.voiceURI}
                                                value={voice.voiceURI}
                                                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            >
                                                {`${voice.name} (${voice.lang})`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                            {role === 'admin' && (
                                <Button<typeof Link>
                                    component={Link}
                                    to="/analysis"
                                    variant="outlined"
                                    startIcon={<AnalyticsIcon />}
                                >
                                    Analysis
                                </Button>
                            )}


                            <Button variant="contained" color="secondary" onClick={logout}>
                                Logout
                            </Button>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddSessionDialogOpen(true)}>
                                Add Session
                            </Button>
                        </Box>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                    ) : userSessions.length === 0 ? (
                        <Alert severity="info">No active sessions. Add a new session to get started!</Alert>
                    ) : (
                        <TableContainer sx={{ maxHeight: '45vh', overflow: 'auto' }}>
                            <Table sx={{ width: '100%', tableLayout: 'fixed' }} stickyHeader aria-label="active sessions table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Start Time</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>End Time</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {userSessions.map((session) => (
                                        <TableRow key={session._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell component="th" scope="row">{session.name}</TableCell>
                                            <TableCell align="right">{session.hours} hr</TableCell>
                                            <TableCell align="right">{session.quantity}</TableCell>
                                            <TableCell align="right">Rs. {session.totalAmount}</TableCell>
                                            <TableCell align="right">{formatTime(session.startTime)}</TableCell>
                                            <TableCell align="right">{formatTime(session.endTime)}</TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                    <IconButton size="small" color="primary" onClick={() => handleAnnounce(session)} aria-label={`announce session for ${session.name}`}>
                                                        <VolumeUpIcon />
                                                    </IconButton>
                                                    <IconButton size="small" color="secondary" onClick={() => handleOpenEditDialog(session)} aria-label={`edit session for ${session.name}`}>
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => handleOpenCompleteConfirmDialog(session._id!)}
                                                        aria-label={`complete session for ${session.name}`}
                                                    >
                                                        <CheckIcon />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleOpenDeleteConfirmDialog(session._id!)} aria-label={`delete session for ${session.name}`}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>

                {/* Add Session Dialog (Modal Form) */}
                <Dialog open={addSessionDialogOpen} onClose={() => setAddSessionDialogOpen(false)} fullWidth maxWidth="sm">
                    <DialogTitle sx={{ fontWeight: 'bold' }}>Add New User Session</DialogTitle>
                    <form onSubmit={handleSubmit}>
                        <DialogContent>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="User Name"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                required
                                sx={{ mb: 2 }}
                            />
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Select Duration</InputLabel>
                                <Select
                                    value={selectedHours}
                                    onChange={(e) => setSelectedHours(Number(e.target.value))}
                                    label="Select Duration"
                                >
                                    {Object.entries(pricingConfig).map(([hour, price]) => (
                                        <MenuItem key={hour} value={hour}>{`${hour} hours - Rs. ${price}`}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Typography variant="subtitle1">Quantity:</Typography>
                                <IconButton onClick={() => setQuantity(Math.max(1, quantity - 1))} color="primary"><RemoveIcon /></IconButton>
                                <Typography sx={{ fontWeight: 'bold', minWidth: '2ch', textAlign: 'center' }}>{quantity}</Typography>
                                <IconButton onClick={() => setQuantity(quantity + 1)} color="primary"><AddIcon /></IconButton>
                            </Box>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.lightest' }}>
                                <Typography variant="h6" color="success.dark" sx={{ fontWeight: 'bold' }}>
                                    Total Amount: Rs. {getTotalAmount()}
                                </Typography>
                            </Paper>
                        </DialogContent>
                        <DialogActions sx={{ p: '0 24px 16px' }}>
                            <Button onClick={() => setAddSessionDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" variant="contained">Add Session</Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Edit Session Dialog */}
                {sessionToEdit && (
                    <Dialog open={editSessionDialogOpen} onClose={handleCloseEditDialog} fullWidth maxWidth="sm">
                        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Session</DialogTitle>
                        <form onSubmit={handleEditSubmit}>
                            <DialogContent>
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    label="User Name"
                                    type="text"
                                    fullWidth
                                    variant="outlined"
                                    value={sessionToEdit.name}
                                    onChange={(e) => setSessionToEdit({ ...sessionToEdit, name: e.target.value })}
                                    required
                                    sx={{ mb: 2 }}
                                />
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Select Duration</InputLabel>
                                    <Select
                                        value={sessionToEdit.hours}
                                        onChange={(e) => setSessionToEdit({ ...sessionToEdit, hours: Number(e.target.value) })}
                                        label="Select Duration"
                                    >
                                        {Object.entries(pricingConfig).map(([hour, price]) => (
                                            <MenuItem key={hour} value={hour}>{`${hour} hours - Rs. ${price}`}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Typography variant="subtitle1">Quantity:</Typography>
                                    <IconButton onClick={() => setSessionToEdit({ ...sessionToEdit, quantity: Math.max(1, sessionToEdit.quantity - 1) })} color="primary"><RemoveIcon /></IconButton>
                                    <Typography sx={{ fontWeight: 'bold', minWidth: '2ch', textAlign: 'center' }}>{sessionToEdit.quantity}</Typography>
                                    <IconButton onClick={() => setSessionToEdit({ ...sessionToEdit, quantity: sessionToEdit.quantity + 1 })} color="primary"><AddIcon /></IconButton>
                                </Box>
                            </DialogContent>
                            <DialogActions sx={{ p: '0 24px 16px' }}>
                                <Button onClick={handleCloseEditDialog}>Cancel</Button>
                                <Button type="submit" variant="contained">Save Changes</Button>
                            </DialogActions>
                        </form>
                    </Dialog>
                )}

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={3000}
                    onClose={() => setSnackbar({ open: false, message: '' })}
                    message={snackbar.message}
                />

                {/* Complete Confirmation Dialog */}
                <Dialog
                    open={completeConfirmDialogOpen}
                    onClose={handleCloseCompleteConfirmDialog}
                >
                    <DialogTitle>Confirm Session Completion</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to mark this session as completed?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseCompleteConfirmDialog}>Cancel</Button>
                        <Button onClick={handleConfirmComplete} color="primary" autoFocus>Confirm</Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteConfirmDialogOpen} onClose={handleCloseDeleteConfirmDialog}>
                    <DialogTitle sx={{ color: 'error.main' }}>Confirm Deletion</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to permanently delete this session? This action cannot be undone.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDeleteConfirmDialog}>Cancel</Button>
                        <Button onClick={handleConfirmDelete} color="error" autoFocus>Delete</Button>
                    </DialogActions>
                </Dialog>

            </div>
        </Box>
    );
};

export default SkatingManagement;
