import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    MenuItem,
    Button,
    Dialog,
    TableFooter,
    FormControl, InputLabel, Select,type SelectChangeEvent,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { getAnalyticsKpis, getAnalyticsTransactions, type UserSession } from '../services/api';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, subDays } from 'date-fns';
import { Link } from 'react-router-dom';
import {
    Today as TodayIcon,
    CalendarMonth as CalendarMonthIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import WeeklySalesChart from '../components/WeeklySalesChart';



interface AnalyticsData {
    todaySales: number;
    monthSales: number;
}

interface DurationSummary {
    hours: number;
    totalQuantity: number;
    totalAmount: number;
}

interface HourlySummary {
    hour: number; // 0-23
    totalQuantity: number;
    totalAmount: number;
}

const Analysis: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [filteredTransactions, setFilteredTransactions] = useState<UserSession[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false);
    const [customStartDate, setCustomStartDate] = useState<Date | null>(new Date());
    const [customEndDate, setCustomEndDate] = useState<Date | null>(new Date());
    const [dateFilter, setDateFilter] = useState('today');
    const [viewMode, setViewMode] = useState<'transactions' | 'durationSummary' | 'hourlySummary'>('transactions');


    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [kpiResponse, transactionResponse] = await Promise.all([
                    getAnalyticsKpis(),
                    getAnalyticsTransactions() // Fetches today's transactions by default
                ]);
                setAnalytics(kpiResponse.data);
                setFilteredTransactions(transactionResponse.data.recentTransactions);
            } catch (err) {
                setError('Failed to fetch analytics data.');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const filterTransactions = useCallback(async (filterType: string, customStartDate?: Date, customEndDate?: Date) => {
        const now = new Date();
        let startDate: Date | undefined = undefined;
        let endDate: Date | undefined = undefined;

        switch (filterType) {
            case 'today':
                startDate = startOfDay(now);
                endDate = endOfDay(now);
                break;
            case 'thisMonth':
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            case 'lastMonth':
                startDate = startOfMonth(subMonths(now, 1)); // Start of the previous month
                endDate = endOfMonth(subMonths(now, 1));   // End of the previous month
                break;
            case 'last3Months':
                startDate = startOfMonth(subMonths(now, 3)); // Start of the month 3 months ago
                endDate = endOfMonth(subMonths(now, 1));   // End of the previous month
                break;
            case 'last7Days':
                startDate = startOfDay(subDays(now, 6));
                endDate = endOfDay(now);
                break;
            case 'custom':
                startDate = customStartDate;
                endDate = customEndDate;
                break;
            case 'all':
            default:
                // No date range to fetch all transactions
                break;
        }

        setLoading(true);
        try {
            const params = (startDate && endDate) ? {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            } : undefined;

            const response = await getAnalyticsTransactions(params);
            setFilteredTransactions(response.data.recentTransactions);
        } catch (err) {
            setError('Failed to fetch transactions.');
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDateFilterChange = (event: SelectChangeEvent<string>) => {
        const newFilter = event.target.value;
        setDateFilter(newFilter);
        if (newFilter === 'custom') {
            setCustomDateDialogOpen(true);
        } else {
            filterTransactions(newFilter);
        }
    };

    const handleApplyCustomDate = () => {
        filterTransactions('custom', customStartDate!, customEndDate!);
        setCustomDateDialogOpen(false);
    };

    const { totalQuantity, totalAmount } = useMemo(() => {
        return filteredTransactions.reduce(
            (acc, transaction) => {
                acc.totalQuantity += transaction.quantity || 0;
                acc.totalAmount += transaction.totalAmount || 0;
                return acc;
            },
            { totalQuantity: 0, totalAmount: 0 }
        );
    }, [filteredTransactions]);

    const durationSummaryData = useMemo((): DurationSummary[] => {
        if (viewMode !== 'durationSummary') return [];

        const summary = filteredTransactions.reduce((acc, tx) => {
            const hours = tx.hours || 0;
            if (!acc[hours]) {
                acc[hours] = { hours, totalQuantity: 0, totalAmount: 0 };
            }
            acc[hours].totalQuantity += tx.quantity || 0;
            acc[hours].totalAmount += tx.totalAmount || 0;
            return acc;
        }, {} as Record<number, DurationSummary>);

        // Convert to array and sort by total quantity descending
        return Object.values(summary).sort((a, b) => b.totalQuantity - a.totalQuantity);
    }, [filteredTransactions, viewMode]);

    const hourlySummaryData = useMemo((): HourlySummary[] => {
        if (viewMode !== 'hourlySummary') return [];

        const summary = filteredTransactions.reduce((acc, tx) => {
            if (!tx.createdAt) return acc;
            const hour = new Date(tx.createdAt).getHours(); // 0-23
            if (!acc[hour]) {
                acc[hour] = { hour, totalQuantity: 0, totalAmount: 0 };
            }
            acc[hour].totalQuantity += tx.quantity || 0;
            acc[hour].totalAmount += tx.totalAmount || 0;
            return acc;
        }, {} as Record<number, HourlySummary>);

        // Convert to array and sort by total quantity descending
        return Object.values(summary).sort((a, b) => b.totalQuantity - a.totalQuantity);
    }, [filteredTransactions, viewMode]);

    const handleViewChange = (
        event: SelectChangeEvent<string>
    ) => {
        const newViewMode = event.target.value as 'transactions' | 'durationSummary' | 'hourlySummary';
        setViewMode(newViewMode);
    };

    if (loading && !analytics) { // Only show full page loader on initial load
        return <Box sx={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>
    }

    if (error) {
        return <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>;
    }

    return (
        <Box sx={{ minHeight: '100vh', width: '100%', bgcolor: 'grey.50', py: 4 }}>
            <div className="w-full h-full mx-auto px-4">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ flex: 1 }} />
                    <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
                        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>Sales Analysis</Typography>
                    </Box>
                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button<typeof Link>
                            component={Link}
                            to="/"
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                        >
                            Back
                        </Button>
                    </Box>
                </Box>

                {/* KPI Cards */}
                <Box sx={{ display: 'flex', gap: 4, mb: 4, flexWrap: 'wrap', justifyContent: 'left' }}>
                    <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 4, boxShadow: 3, width: 'fit-content' }}>
                        <TodayIcon color="primary" sx={{ fontSize: 40 }} />
                        <Box>
                            <Typography variant="h6" color="text.secondary">Today's Sales</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Rs. {analytics?.todaySales.toLocaleString()}</Typography>
                        </Box>
                    </Paper>
                    <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 4, boxShadow: 3, width: 'fit-content' }}>
                        <CalendarMonthIcon color="secondary" sx={{ fontSize: 40 }} />
                        <Box>
                            <Typography variant="h6" color="text.secondary">This Month's Sales</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Rs. {analytics?.monthSales.toLocaleString()}</Typography>
                        </Box>
                    </Paper>
                </Box>

                {/* Bar Chart */}
                <WeeklySalesChart />

                {/* Recent Transactions Table */}
                <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 4, boxShadow: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            Transactions
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', marginLeft: 'auto' }}>
                            <FormControl sx={{ minWidth: 180 }} size="small">
                                <InputLabel>View</InputLabel>
                                <Select
                                    value={viewMode}
                                    label="View"
                                    onChange={handleViewChange}
                                >
                                    <MenuItem value="transactions">Transactions</MenuItem>
                                    <MenuItem value="durationSummary">Summary by Duration</MenuItem>
                                    <MenuItem value="hourlySummary">Summary by Hour</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl sx={{ minWidth: 180 }} size="small">
                                <InputLabel>Date Filter</InputLabel>
                                <Select
                                    value={dateFilter}
                                    label="Date Filter"
                                    onChange={handleDateFilterChange}
                                >
                                    <MenuItem value="today">Today</MenuItem>
                                    <MenuItem value="last7Days">Last 7 Days</MenuItem>
                                    <MenuItem value="thisMonth">This Month</MenuItem>
                                    <MenuItem value="lastMonth">Last Month</MenuItem>
                                    <MenuItem value="last3Months">Last 3 Months</MenuItem>
                                    <MenuItem value="all">All Time</MenuItem>
                                    <MenuItem value="custom">Custom Range</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                    <TableContainer sx={{ maxHeight: '60vh' }}>
                        <Table stickyHeader sx={{ width: '100%', tableLayout: 'fixed' }} aria-label="recent transactions table">
                            {viewMode === 'transactions' ? (
                                <>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Duration (hr)</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    <CircularProgress size={24} />
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredTransactions.length > 0 ? (
                                            filteredTransactions.map((tx) => (
                                                <TableRow key={tx._id}>
                                                    <TableCell component="th" scope="row">{tx.name}</TableCell>
                                                    <TableCell>
                                                        {tx.createdAt ? format(new Date(tx.createdAt), 'MMM d, yyyy, h:mm a') : 'N/A'}
                                                    </TableCell>
                                                    <TableCell align="right">{tx.hours}</TableCell>
                                                    <TableCell align="right">{tx.quantity}</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'medium' }}>Rs. {tx.totalAmount}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">
                                                    <Typography>No transactions for this period.</Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 'bold', borderTop: '2px solid rgba(224, 224, 224, 1)', position: 'sticky', bottom: 0, bgcolor: 'background.paper' } }}>
                                            <TableCell colSpan={3} align="right">Total</TableCell>
                                            <TableCell align="right">{totalQuantity}</TableCell>
                                            <TableCell align="right">Rs. {totalAmount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </>
                            ) : (
                                viewMode === 'durationSummary' ? (
                                    <>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Duration (hr)</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Skaters</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} align="center">
                                                        <CircularProgress size={24} />
                                                    </TableCell>
                                                </TableRow>
                                            ) : durationSummaryData.length > 0 ? (
                                                durationSummaryData.map((summary) => (
                                                    <TableRow key={summary.hours}>
                                                        <TableCell component="th" scope="row">{summary.hours}</TableCell>
                                                        <TableCell align="right">{summary.totalQuantity}</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 'medium' }}>Rs. {summary.totalAmount.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} align="center">
                                                        <Typography>No data to summarize for this period.</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow
                                                sx={{
                                                    '& .MuiTableCell-root': {
                                                        fontWeight: 'bold',
                                                        borderTop: '2px solid rgba(224, 224, 224, 1)',
                                                        position: 'sticky',
                                                        bottom: 0,
                                                        bgcolor: 'background.paper',
                                                    },
                                                }}
                                            >
                                                <TableCell colSpan={1} align="right">Total</TableCell>
                                                <TableCell align="right">{totalQuantity}</TableCell>
                                                <TableCell align="right">
                                                    Rs. {totalAmount.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </>
                                ) : ( // hourlySummary view
                                    <>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Hour of Day</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Skaters</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} align="center">
                                                        <CircularProgress size={24} />
                                                    </TableCell>
                                                </TableRow>
                                            ) : hourlySummaryData.length > 0 ? (
                                                hourlySummaryData.map((summary) => (
                                                    <TableRow key={summary.hour}>
                                                        <TableCell component="th" scope="row">
                                                            {`${summary.hour}:00 - ${summary.hour + 1}:00`}
                                                        </TableCell>
                                                        <TableCell align="right">{summary.totalQuantity}</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 'medium' }}>Rs. {summary.totalAmount.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} align="center">
                                                        <Typography>No data to summarize for this period.</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow
                                                sx={{
                                                    '& .MuiTableCell-root': {
                                                        fontWeight: 'bold',
                                                        borderTop: '2px solid rgba(224, 224, 224, 1)',
                                                        position: 'sticky',
                                                        bottom: 0,
                                                        bgcolor: 'background.paper',
                                                    },
                                                }}
                                            >
                                                <TableCell colSpan={1} align="right">Total</TableCell>
                                                <TableCell align="right">{totalQuantity}</TableCell>
                                                <TableCell align="right">Rs. {totalAmount.toLocaleString()}</TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </>
                                )
                            )}
                        </Table>
                    </TableContainer>
                </Paper>

                {/* Custom Date Range Dialog */}
                <Dialog open={customDateDialogOpen} onClose={() => setCustomDateDialogOpen(false)}>
                    <DialogTitle>Select Custom Date Range</DialogTitle>
                    <DialogContent>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                                <DatePicker
                                    label="Start Date"
                                    value={customStartDate}
                                    onChange={(newValue) => setCustomStartDate(newValue)}
                                />
                                <DatePicker
                                    label="End Date"
                                    value={customEndDate}
                                    onChange={(newValue) => setCustomEndDate(newValue)}
                                    minDate={customStartDate || undefined}
                                />
                            </Box>
                        </LocalizationProvider>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCustomDateDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleApplyCustomDate}
                            variant="contained"
                            disabled={!customStartDate || !customEndDate}
                        >
                            Apply
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Box>
    );
};

export default Analysis;