import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Typography, IconButton, CircularProgress, Alert, Paper } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { addDays, subDays, startOfWeek, endOfWeek, } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { getWeeklySales } from '../services/api';

const formatYAxis = (value: any): string => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return ` ${(value / 1000).toFixed(1)}k`;
    }
    return `${value}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <Paper elevation={3} sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                <Typography variant="h6" gutterBottom>{label}</Typography>
                <Typography variant="body2" sx={{ color: payload[0].color }}>
                    {`Sales: NRP ${payload[0].value.toLocaleString()}`}
                </Typography>
            </Paper>
        );
    }

    return null;
};
const WeeklySalesChart: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const [chartData, setChartData] = useState<{ labels: string[]; datasets: any[] }>({ labels: [], datasets: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        const fetchChartData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getWeeklySales(currentDate);
                const weeklySales = response.data.weeklySales;
                setChartData({
                    labels: weeklySales.map(d => d.name),
                    datasets: [
                        {
                            label: 'Daily Sales',
                            data: weeklySales.map(d => d.sales),
                            backgroundColor: (context: any) => {
                                return 'rgba(54, 162, 235, 0.6)';
                            },
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1,
                        },
                    ],
                });
            } catch (err) {
                setError('Failed to fetch weekly sales data.');
            } finally {
                setLoading(false);
            }
        };


        fetchChartData();
    }, [currentDate, userTimeZone]);

    const handleDateChange = (newDate: Date | null) => {
        if (newDate) {
            setCurrentDate(newDate);
        }
    };

    const handlePreviousWeek = () => {
        setCurrentDate(subDays(currentDate, 7));
    };

    const handleNextWeek = () => {
        setCurrentDate(addDays(currentDate, 7));
    };


    return (<Box sx={{ width: '100%', p: 2, '& .recharts-wrapper': { outline: 'none' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, m: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={handlePreviousWeek}>
                    <NavigateBeforeIcon />
                </IconButton>
                <Typography variant="h6" sx={{ mx: 2 }}>
                    {formatInTimeZone(weekStart, userTimeZone, 'MMM d')} - {formatInTimeZone(weekEnd, userTimeZone, 'MMM d, yyyy')}
                </Typography>
                <IconButton onClick={handleNextWeek}>
                    <NavigateNextIcon />
                </IconButton>
            </Box>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker

                    label="Select Week"
                    value={currentDate}
                    onChange={handleDateChange}
                />
            </LocalizationProvider>

        </Box>

        <Box sx={{ height: 400, position: 'relative' }}>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            ) : (
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                        data={chartData.datasets[0].data.map((sales: any, index: any) => ({
                            name: chartData.labels[index],
                            sales: sales,
                        }))}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 30,
                            bottom: 5,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={formatYAxis} label={{ value: 'Sales (NRP)', angle: -90, position: 'insideLeft', offset: -10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="sales" fill="url(#colorSales)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>

            )}
        </Box>
    </Box>
    );
};

export default WeeklySalesChart;