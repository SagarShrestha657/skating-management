import React, { useState, useEffect, useCallback,  } from 'react';
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
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext';
import { subscribeUserToPush } from '../utils/pushNotifications';
import { type UserSession, getActiveSessions, createSession, deleteSession } from '../services/api';


const SkatingManagement: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const { role, logout } = useAuth();
    const [userSessions, setUserSessions] = useState<UserSession[]>([]);
    const [userName, setUserName] = useState('');
    const [selectedHours, setSelectedHours] = useState<number>(0.5);
    const [quantity, setQuantity] = useState(1);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [sessionToComplete, setSessionToComplete] = useState<string | null>(null);
    const [addSessionDialogOpen, setAddSessionDialogOpen] = useState(false);
   // const [notifiedSessions, setNotifiedSessions] = useState<Set<string>>(new Set());
    //const [notificationCounts, setNotificationCounts] = useState<Record<string, number>>({});
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>();
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
    const [showNotificationDialog, setShowNotificationDialog] = useState(false);

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

    // Effect to prompt for push notifications once per day
    useEffect(() => {
        // Check if notifications are supported and permission has not been granted or denied yet
        if ('PushManager' in window && Notification.permission === 'default') {
            const lastPromptDate = localStorage.getItem('lastNotificationPrompt');
            const today = new Date().toDateString();

            // If we haven't prompted today, show the dialog
            if (!lastPromptDate || new Date(lastPromptDate).toDateString() !== today) {
                setShowNotificationDialog(true);
                localStorage.setItem('lastNotificationPrompt', new Date().toISOString());
            }
        }
    }, []);

    // Use a ref to access the latest notification counts inside the interval without re-triggering the effect.
    // const notificationCountsRef = useRef(notificationCounts);
    // notificationCountsRef.current = notificationCounts;

    // // Effect for audio notifications
    // useEffect(() => {
    //     const timer = setInterval(() => {
    //         // Do not process if speech is already in progress
    //         if (window.speechSynthesis.speaking) {
    //             return;
    //         }

    //         const now = new Date();

    //         // Find the first session that needs notification. The list is already sorted by end time.
    //         const sessionToNotify = userSessions.find(session => {
    //             if (!session._id || !session.endTime) return false;
    //             const endTime = new Date(session.endTime);

    //             return now >= endTime && !notifiedSessions.has(session._id);
    //         });
    //         console.log(sessionToNotify);
    //         if (sessionToNotify) {
    //             const sessionId = sessionToNotify._id!;
    //             const count = notificationCountsRef.current[sessionId] || 0;

    //             if (count < 3) {
    //                 const utterance = new SpeechSynthesisUtterance(
    //                     `कृपया ध्यान दिनुहोस् ${sessionToNotify.name}, तपाईंको स्केटिङ सत्र समाप्त भएको छ, फेरि आउनुहोला।`
    //                 );
    //                 utterance.rate = 0.9;
    //                 utterance.pitch = 0.8;
    //                 const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
    //                 if (selectedVoice) {
    //                     utterance.voice = selectedVoice;
    //                 }
    //                 window.speechSynthesis.speak(utterance);

    //                 // Update the count for this specific session
    //                 setNotificationCounts(prev => ({ ...prev, [sessionId]: count + 1 }));
    //             } else {
    //                 // Mark as fully notified and move to the next session in the next interval
    //                 setNotifiedSessions(prev => new Set(prev).add(sessionId));
    //             }
    //         }
    //     }, 5000); // Check every 5 seconds

    //     // Cleanup the interval on component unmount
    //     return () => {
    //         clearInterval(timer);
    //         window.speechSynthesis.cancel(); // Stop any speech if component unmounts
    //     };
    // }, [userSessions, notifiedSessions, voices, selectedVoiceURI]);

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

    // Opens the confirmation dialog
    const handleOpenConfirmDialog = (id: string) => {
        setSessionToComplete(id);
        setConfirmDialogOpen(true);
    };

    // Closes the confirmation dialog
    const handleCloseConfirmDialog = () => {
        setSessionToComplete(null);
        setConfirmDialogOpen(false);
    };

    // Handles the actual session completion after confirmation
    const handleConfirmComplete = async () => {
        if (!sessionToComplete) return;

        const completedSessionId = sessionToComplete;

        try {
            await deleteSession(completedSessionId);
            setSnackbar({ open: true, message: 'Session marked as complete!' });

            // Clean up notification state for the completed session
            // setNotifiedSessions(prev => {
            //     const newSet = new Set(prev);
            //     newSet.delete(completedSessionId);
            //     return newSet;
            // });
            // setNotificationCounts(prev => {
            //     const newCounts = { ...prev };
            //     delete newCounts[completedSessionId];
            //     return newCounts;
            // });

            fetchSessions();
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to complete session.' });
        } finally {
            handleCloseConfirmDialog();
        }
    };

    // Handles the manual announcement for a specific session
    const handleAnnounce = (name: string) => {
        // Cancel any ongoing speech to prioritize the manual announcement
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
            `कृपया ध्यान दिनुहोस् ${name}, तपाईंको स्केटिङ सत्र समाप्त भएको छ, फेरि आउनुहोला।`
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
        setShowNotificationDialog(false);
        if (success) {
            setSnackbar({ open: true, message: 'Push notifications have been enabled!' });
        } else {
            setSnackbar({ open: true, message: 'Could not enable push notifications. Please check your browser settings.' });
        }
    };

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // This function unlocks the browser's audio context on the first user interaction.
    const handleFirstInteraction = useCallback(() => {
        if (isAudioUnlocked) return;

        // Play a silent utterance to unlock the audio context.
        if (window.speechSynthesis.speaking === false && window.speechSynthesis.pending === false) {
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
        }
        setIsAudioUnlocked(true);
    }, [isAudioUnlocked]);

    return (
        <Box sx={{ minHeight: '100vh', minWidth: '100vw', bgcolor: 'grey.50', py: 2 }} onClick={handleFirstInteraction}>
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

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
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
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleAnnounce(session.name)}
                                                        aria-label={`announce session for ${session.name}`}
                                                    >
                                                        <VolumeUpIcon />
                                                    </IconButton>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        variant="outlined"
                                                        onClick={() => handleOpenConfirmDialog(session._id!)}
                                                    >
                                                        Complete
                                                    </Button>
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

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={3000}
                    onClose={() => setSnackbar({ open: false, message: '' })}
                    message={snackbar.message}
                />

                {/* Confirmation Dialog */}
                <Dialog
                    open={confirmDialogOpen}
                    onClose={handleCloseConfirmDialog}
                >
                    <DialogTitle>Confirm Session Completion</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Is the time over for this session? This will mark the session as completed.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
                        <Button onClick={handleConfirmComplete} color="primary" autoFocus>Confirm</Button>
                    </DialogActions>
                </Dialog>

                {/* Notification Permission Dialog */}
                <Dialog open={showNotificationDialog} onClose={() => setShowNotificationDialog(false)}>
                    <DialogTitle sx={{ fontWeight: 'bold' }}>Enable Push Notifications</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Enable push notifications to get alerts when a session ends, even if the app is in the background or closed.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowNotificationDialog(false)}>Not Now</Button>
                        <Button onClick={handleEnableNotifications} variant="contained" startIcon={<NotificationsActiveIcon />}>
                            Enable
                        </Button>
                    </DialogActions>
                </Dialog>

            </div>
        </Box>
    );
};

export default SkatingManagement;
