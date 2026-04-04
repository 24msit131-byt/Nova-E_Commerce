import React, { useState, useEffect, useMemo } from 'react';
import { FaBox, FaUsers, FaShoppingCart, FaRupeeSign, FaChartBar, FaEllipsisH } from 'react-icons/fa';
import AdminSidebar from '../../../components/AdminSlider';
import api from '../../../services/api';

const STATUS_STYLES = {
    Processing: { label: 'Processing', className: 'bg-[#FAF7F2] border border-[#E0D8CC] text-[#A68A64]' },
    Pending: { label: 'Pending', className: 'bg-[#FAF7F2] border border-[#E0D8CC] text-[#A68A64]' },
    Packed: { label: 'Packed', className: 'bg-[#E9E2D8] text-[#4A4036]' },
    Shipped: { label: 'Shipped', className: 'bg-[#E0D8CC] text-[#4A4036]' },
    Delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800' },
    Cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
    Returned: { label: 'Returned', className: 'bg-[#F1E7DA] text-[#4A4036]' },
    'Return Request': { label: 'Return Requested', className: 'bg-amber-100 text-amber-800' },
    'Return Approved': { label: 'Return Approved', className: 'bg-[#DDE7D8] text-[#47634B]' },
    'Return Rejected': { label: 'Return Rejected', className: 'bg-red-100 text-red-700' },
};

const getOrderStatusInfo = (order) => {
    const fulfillmentStatus = order?.status || (order?.isDelivered ? 'Delivered' : order?.isPaid ? 'Processing' : 'Pending');
    const returnStatus = order?.returnRequest?.status;

    const effectiveStatus = returnStatus && returnStatus !== 'None'
        ? (returnStatus === 'Requested' ? 'Return Request' : returnStatus === 'Approved' ? 'Return Approved' : returnStatus === 'Rejected' ? 'Return Rejected' : returnStatus === 'Completed' ? 'Returned' : returnStatus)
        : fulfillmentStatus;

    return STATUS_STYLES[effectiveStatus] || { label: effectiveStatus, className: 'bg-[#FAF7F2] border border-[#E0D8CC] text-[#4A4036]' };
};

const TREND_FILTERS = [
    { key: 'weekly', label: 'Weekly', helper: 'Last 7 days' },
    { key: 'monthly', label: 'Monthly', helper: 'Last 30 days' },
    { key: 'yearly', label: 'Yearly', helper: 'Last 12 months' },
];

const TREND_COLORS = {
    current: '#5B5CE2',
    previous: '#C6D0EA',
    border: '#E8EEF6',
    background: '#FBFCFF',
    text: '#334155',
    muted: '#64748B',
};

const formatINRCurrency = (value, maximumFractionDigits = 0) => (
    `₹${new Intl.NumberFormat('en-IN', {
        maximumFractionDigits,
    }).format(Number(value || 0))}`
);

const getNiceTickStep = (maxValue) => {
    if (maxValue <= 0) return 1000;

    const rawStep = maxValue / 4;
    const magnitude = 10 ** Math.floor(Math.log10(rawStep));
    const normalized = rawStep / magnitude;

    if (normalized <= 1) return 1 * magnitude;
    if (normalized <= 2) return 2 * magnitude;
    if (normalized <= 5) return 5 * magnitude;
    return 10 * magnitude;
};

const buildSmoothPath = (points) => {
    if (!points.length) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let index = 0; index < points.length - 1; index += 1) {
        const currentPoint = points[index];
        const nextPoint = points[index + 1];
        const controlX = (currentPoint.x + nextPoint.x) / 2;

        path += ` C ${controlX} ${currentPoint.y}, ${controlX} ${nextPoint.y}, ${nextPoint.x} ${nextPoint.y}`;
    }

    return path;
};

const RevenueOverviewCard = ({ loading, error, data, period, onPeriodChange }) => {
    const periodMeta = TREND_FILTERS.find((item) => item.key === period) || TREND_FILTERS[0];
    const labels = data?.labels || [];
    const currentSeries = data?.currentSeries || [];
    const comparisonSeries = data?.comparisonSeries || [];
    const currentLabel = data?.currentLabel || periodMeta.label;
    const previousLabel = data?.previousLabel || 'Previous';
    const subtitle = data?.subtitle || 'Revenue compared to the previous period';
    const totals = data?.totals || {};

    const summary = useMemo(() => {
        const combinedValues = [...currentSeries, ...comparisonSeries].map((point) => Number(point.value || 0));
        const maxValue = Math.max(...combinedValues, 1);
        const tickStep = getNiceTickStep(maxValue);
        const axisMax = tickStep * 4;

        return {
            axisMax,
            tickStep,
            currentRevenue: Number(totals.currentRevenue || 0),
            previousRevenue: Number(totals.previousRevenue || 0)
        };
    }, [comparisonSeries, currentSeries, totals.currentRevenue, totals.previousRevenue]);

    const chart = useMemo(() => {
        const width = Math.max(labels.length * 72, 760);
        const height = 300;
        const padding = { top: 24, right: 24, bottom: 48, left: 24 };
        const usableWidth = width - padding.left - padding.right;
        const usableHeight = height - padding.top - padding.bottom;

        if (!labels.length) {
            return {
                width,
                height,
                padding,
                gridLines: [],
                labelPositions: [],
                yTicks: [],
                currentLinePath: '',
                comparisonLinePath: '',
                currentAreaPath: '',
                comparisonAreaPath: '',
            };
        }

        const step = labels.length === 1 ? 0 : usableWidth / (labels.length - 1);

        const mapSeriesToPoints = (series) => series.map((point, index) => {
            const value = Number(point.value || 0);
            const x = labels.length === 1 ? width / 2 : padding.left + (index * step);
            const y = height - padding.bottom - ((value / summary.axisMax) * usableHeight);

            return { x, y, value };
        });

        const currentPoints = mapSeriesToPoints(currentSeries);
        const comparisonPoints = mapSeriesToPoints(comparisonSeries);
        const currentLinePath = buildSmoothPath(currentPoints);
        const comparisonLinePath = buildSmoothPath(comparisonPoints);
        const currentAreaPath = currentLinePath
            ? `${currentLinePath} L ${currentPoints[currentPoints.length - 1].x} ${height - padding.bottom} L ${currentPoints[0].x} ${height - padding.bottom} Z`
            : '';
        const comparisonAreaPath = comparisonLinePath
            ? `${comparisonLinePath} L ${comparisonPoints[comparisonPoints.length - 1].x} ${height - padding.bottom} L ${comparisonPoints[0].x} ${height - padding.bottom} Z`
            : '';

        const yTicks = [4, 3, 2, 1, 0].map((multiplier) => summary.tickStep * multiplier);

        return {
            width,
            height,
            padding,
            currentPoints,
            comparisonPoints,
            currentLinePath,
            comparisonLinePath,
            currentAreaPath,
            comparisonAreaPath,
            gridLines: yTicks.map((tickValue) => ({
                value: tickValue,
                y: height - padding.bottom - ((tickValue / summary.axisMax) * usableHeight)
            })),
            labelPositions: labels,
            yTicks,
        };
    }, [currentSeries, comparisonSeries, labels, summary.axisMax, summary.tickStep]);

    const peakLabel = useMemo(() => {
        let peak = null;

        currentSeries.forEach((point) => {
            const value = Number(point.value || 0);
            if (!peak || value > peak.value) {
                peak = { ...point, value };
            }
        });

        return peak;
    }, [currentSeries]);

    return (
        <section className="bg-white rounded-[28px] shadow-[0_8px_30px_rgba(15,23,42,0.07)] border border-[#E8EEF6] overflow-hidden mb-12">
            <div className="p-8 pb-6 flex flex-col gap-6 lg:flex-row lg:items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Revenue Overview</h2>
                    <p className="text-slate-500 mt-1">{subtitle}</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-end">
                    <div className="flex flex-wrap gap-2">
                        {TREND_FILTERS.map((filter) => (
                            <button
                                key={filter.key}
                                onClick={() => onPeriodChange(filter.key)}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.22em] border transition-all ${period === filter.key
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <button type="button" className="h-10 w-10 rounded-full border border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex items-center justify-center">
                        <FaEllipsisH />
                    </button>
                </div>
            </div>

            <div className="px-8 pb-8">
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5B5CE2]"></div>
                        <p className="mt-4 text-slate-500 text-xs font-semibold uppercase tracking-[0.2em]">Loading revenue overview...</p>
                    </div>
                ) : error ? (
                    <div className="py-20 text-center">
                        <p className="text-red-500 font-semibold">{error}</p>
                    </div>
                ) : labels.length === 0 ? (
                    <div className="py-20 text-center text-slate-500 italic">
                        No revenue data found.
                    </div>
                ) : (
                    <div className="rounded-[24px] bg-[#FBFCFF] border border-[#E8EEF6] p-5 sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#5B5CE2]" />
                                    {currentLabel}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#C6D0EA]" />
                                    {previousLabel}
                                </span>
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                                {formatINRCurrency(summary.currentRevenue)} selected
                            </div>
                        </div>

                        <div className="grid grid-cols-[72px_1fr] gap-3 sm:gap-4">
                            <div className="flex h-[300px] flex-col justify-between py-2 text-[11px] text-slate-400 font-medium tabular-nums">
                                {chart.yTicks.map((tickValue) => (
                                    <span key={tickValue} className="-translate-y-1">
                                        {formatINRCurrency(tickValue)}
                                    </span>
                                ))}
                            </div>

                            <div className="overflow-x-auto pb-1">
                                <div className="min-w-[760px]" style={{ width: `${chart.width}px` }}>
                                    <svg
                                        viewBox={`0 0 ${chart.width} ${chart.height}`}
                                        className="w-full h-[300px] overflow-visible"
                                        preserveAspectRatio="none"
                                    >
                                        <defs>
                                            <linearGradient id="revenueOverviewAreaCurrent" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="rgba(91, 92, 226, 0.36)" />
                                                <stop offset="100%" stopColor="rgba(91, 92, 226, 0.02)" />
                                            </linearGradient>
                                            <linearGradient id="revenueOverviewAreaComparison" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="rgba(198, 208, 234, 0.36)" />
                                                <stop offset="100%" stopColor="rgba(198, 208, 234, 0.02)" />
                                            </linearGradient>
                                            <linearGradient id="revenueOverviewLineCurrent" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#5B5CE2" />
                                                <stop offset="100%" stopColor="#4648D8" />
                                            </linearGradient>
                                            <linearGradient id="revenueOverviewLineComparison" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#BCC7E6" />
                                                <stop offset="100%" stopColor="#D6DEF1" />
                                            </linearGradient>
                                        </defs>

                                        {chart.gridLines.map((line) => (
                                            <line
                                                key={line.value}
                                                x1={chart.padding.left}
                                                x2={chart.width - chart.padding.right}
                                                y1={line.y}
                                                y2={line.y}
                                                stroke="#E8EEF6"
                                                strokeDasharray="5 6"
                                            />
                                        ))}

                                        {chart.comparisonAreaPath && (
                                            <path d={chart.comparisonAreaPath} fill="url(#revenueOverviewAreaComparison)" />
                                        )}
                                        {chart.currentAreaPath && (
                                            <path d={chart.currentAreaPath} fill="url(#revenueOverviewAreaCurrent)" />
                                        )}

                                        {chart.comparisonLinePath && (
                                            <path
                                                d={chart.comparisonLinePath}
                                                fill="none"
                                                stroke="url(#revenueOverviewLineComparison)"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        )}
                                        {chart.currentLinePath && (
                                            <path
                                                d={chart.currentLinePath}
                                                fill="none"
                                                stroke="url(#revenueOverviewLineCurrent)"
                                                strokeWidth="3.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        )}
                                    </svg>

                                    <div className="grid gap-2 mt-3" style={{ gridTemplateColumns: `repeat(${chart.labelPositions.length}, minmax(0, 1fr))` }}>
                                        {chart.labelPositions.map((label) => (
                                            <div key={label} className="text-center text-[11px] text-slate-500 font-medium">
                                                {label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#5B5CE2]" />
                                Current {periodMeta.label.toLowerCase()}
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#C6D0EA]" />
                                Previous {periodMeta.label.toLowerCase()}
                            </span>
                            <span className="ml-auto text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Peak {peakLabel ? `${peakLabel.label} • ${formatINRCurrency(peakLabel.value)}` : 'No data'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

const AdminDashboard = () => {
    const [statsData, setStatsData] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        activeUsers: 0,
        totalProducts: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [orderTrendRange, setOrderTrendRange] = useState('weekly');
    const [orderTrendSeries, setOrderTrendSeries] = useState([]);
    const [orderTrendLoading, setOrderTrendLoading] = useState(true);
    const [orderTrendError, setOrderTrendError] = useState(null);
    const [activeTrendPoint, setActiveTrendPoint] = useState(null);
    const [revenueOverviewPeriod, setRevenueOverviewPeriod] = useState('yearly');
    const [revenueOverviewData, setRevenueOverviewData] = useState(null);
    const [revenueOverviewLoading, setRevenueOverviewLoading] = useState(true);
    const [revenueOverviewError, setRevenueOverviewError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [statsRes, ordersRes] = await Promise.all([
                    api.get('/reports/stats'),
                    api.get('/reports/recent-orders')
                ]);

                if (statsRes.data.success) {
                    setStatsData(statsRes.data.data);
                }
                if (ordersRes.data.success) {
                    setRecentOrders(ordersRes.data.data);
                }
                setError(null);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    useEffect(() => {
        const fetchOrderTrendData = async () => {
            try {
                setOrderTrendLoading(true);
                const response = await api.get('/reports/order-trends', {
                    params: { period: orderTrendRange }
                });

                if (response.data.success) {
                    setOrderTrendSeries(response.data.data.series || []);
                    setOrderTrendError(null);
                }
            } catch (err) {
                console.error('Error fetching order trend data:', err);
                setOrderTrendError('Failed to load order trend chart. Please try again later.');
            } finally {
                setOrderTrendLoading(false);
            }
        };

        fetchOrderTrendData();
    }, [orderTrendRange]);

    useEffect(() => {
        const fetchRevenueOverviewData = async () => {
            try {
                setRevenueOverviewLoading(true);
                const response = await api.get('/reports/revenue-overview', {
                    params: { period: revenueOverviewPeriod }
                });

                if (response.data.success) {
                    setRevenueOverviewData(response.data.data);
                    setRevenueOverviewError(null);
                }
            } catch (err) {
                console.error('Error fetching revenue overview data:', err);
                setRevenueOverviewError('Failed to load revenue overview. Please try again later.');
            } finally {
                setRevenueOverviewLoading(false);
            }
        };

        fetchRevenueOverviewData();
    }, [revenueOverviewPeriod]);

    // Updated stats with the Earthy Gold theme
    const stats = [
        { label: 'Total Revenue', value: String(statsData.totalRevenue).startsWith('₹') ? statsData.totalRevenue : `₹${statsData.totalRevenue}`, icon: <FaRupeeSign />, color: 'bg-[#A68A64]' },
        { label: 'Total Orders', value: statsData.totalOrders, icon: <FaShoppingCart />, color: 'bg-[#4A4036]' },
        { label: 'Active Users', value: statsData.activeUsers, icon: <FaUsers />, color: 'bg-[#A68A64]' },
        { label: 'Products', value: statsData.totalProducts, icon: <FaBox />, color: 'bg-[#4A4036]' },
    ];

    const orderTrendStats = useMemo(() => {
        let total = 0;
        let peakPoint = null;

        orderTrendSeries.forEach((point) => {
            const value = Number(point.value || 0);
            total += value;

            if (!peakPoint || value > peakPoint.value) {
                peakPoint = { ...point, value };
            }
        });

        return {
            total,
            average: orderTrendSeries.length ? total / orderTrendSeries.length : 0,
            peakPoint,
            maxValue: Math.max(...orderTrendSeries.map((point) => Number(point.value || 0)), 1)
        };
    }, [orderTrendSeries]);

    const orderTrendMinWidth = Math.max(orderTrendSeries.length * 24, 720);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF7F2] flex">
                <AdminSidebar />
                <main className="flex-1 p-8 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A68A64]"></div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF7F2] flex font-sans">
            <AdminSidebar />
            <main className="flex-1 p-8 md:p-12">
                {/* Header Section */}
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-[#4A4036] uppercase tracking-tight">Admin Dashboard</h1>
                    <p className="text-[#A68A64] font-medium tracking-wide uppercase text-xs mt-1">Overview & Business Analytics</p>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                        {error}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0D8CC] flex items-center hover:shadow-md transition-shadow">
                            <div className={`${stat.color} p-4 rounded-xl text-white mr-5 shadow-inner`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-[10px] text-[#A68A64] font-black uppercase tracking-widest">{stat.label}</p>
                                <p className="text-2xl font-bold text-[#4A4036]">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Trend Chart */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-[#E0D8CC] overflow-hidden mb-12">
                    <div className="p-8 border-b border-[#FAF7F2] flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-[#F5F5F5]/30">
                        <div>
                            <div className="flex items-center gap-3 text-[#A68A64] uppercase tracking-[0.25em] text-[10px] font-black mb-3">
                                <FaChartBar />
                                <span>Order Trend</span>
                            </div>
                            <h2 className="text-2xl font-bold text-[#4A4036] uppercase tracking-tight">Orders over time</h2>
                            <p className="text-sm text-[#A68A64] mt-2 max-w-2xl">
                                Review how order activity changes across weekly, monthly, and yearly windows.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {TREND_FILTERS.map((filter) => (
                                <button
                                    key={filter.key}
                                    onClick={() => setOrderTrendRange(filter.key)}
                                    className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${orderTrendRange === filter.key
                                        ? 'bg-[#5B5CE2] text-white border-[#5B5CE2] shadow-md'
                                        : 'bg-white text-[#64748B] border-[#E8EEF6] hover:border-[#5B5CE2] hover:text-[#334155]'
                                        }`}
                                >
                                    <span>{filter.label}</span>
                                    <span className="block mt-1 opacity-70 tracking-[0.18em]">{filter.helper}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-8">
                        {orderTrendLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: TREND_COLORS.current }}></div>
                                <p className="mt-4 text-[10px] font-black uppercase tracking-widest" style={{ color: TREND_COLORS.muted }}>Loading chart...</p>
                            </div>
                        ) : orderTrendError ? (
                            <div className="py-20 text-center">
                                <p className="text-red-500 font-bold text-sm">{orderTrendError}</p>
                            </div>
                        ) : (
                            <div className="grid lg:grid-cols-[1.5fr_0.7fr] gap-8 items-stretch">
                                <div className="relative h-full rounded-[1.75rem] border border-[#E8EEF6] bg-[#FBFCFF] p-5 flex flex-col justify-end">
                                    {activeTrendPoint && (
                                        <div
                                            className="pointer-events-none absolute top-5 z-20 w-52 -translate-x-1/2 rounded-[18px] border border-slate-100 bg-white px-4 py-3 text-left shadow-[0_12px_30px_rgba(15,23,42,0.14)]"
                                            style={{
                                                left: `${((activeTrendPoint.index + 0.5) / orderTrendSeries.length) * 100}%`,
                                            }}
                                        >
                                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
                                                {activeTrendPoint.label}
                                            </p>
                                            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                                Orders
                                            </p>
                                            <p className="mt-1 text-xl font-black tracking-tight" style={{ color: TREND_COLORS.current }}>
                                                {activeTrendPoint.value}
                                            </p>
                                            <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-slate-100 bg-white" />
                                        </div>
                                    )}

                                    <div className="overflow-x-auto pb-2 pt-16">
                                        <div className="min-w-[720px]" style={{ width: `${orderTrendMinWidth}px` }}>
                                            <div className="flex items-end gap-4 h-[18rem]">
                                                {orderTrendSeries.map((point, index) => {
                                                    const barHeight = `${Math.max((Number(point.value || 0) / orderTrendStats.maxValue) * 100, point.value ? 8 : 3)}%`;

                                                    return (
                                                        <div
                                                            key={point.label}
                                                            className="flex-1 min-w-[18px] h-full flex flex-col justify-end items-center gap-3"
                                                            onMouseEnter={() => setActiveTrendPoint({ ...point, index })}
                                                            onMouseLeave={() => setActiveTrendPoint(null)}
                                                        >
                                                            <div className="w-full flex-1 flex items-end">
                                                                <div
                                                                    className="w-full rounded-t-2xl bg-gradient-to-t from-[#C6D0EA] via-[#5B5CE2] to-[#4648D8] shadow-[0_16px_30px_rgba(91,92,226,0.18)] transition-all"
                                                                    style={{ height: barHeight }}
                                                                />
                                                            </div>
                                                            <div className="text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: TREND_COLORS.muted }}>
                                                                {point.label}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4 content-start">
                                    <div className="rounded-2xl bg-[#4A4036] text-white p-6 shadow-md ">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D7BF99]">Orders in range</p>
                                        <p className="mt-3 text-4xl font-bold">{orderTrendStats.total}</p>
                                        <p className="mt-2 text-sm text-white/75">Selected {orderTrendRange} period</p>
                                    </div>

                                    <div className="rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] p-6">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A68A64]">Peak activity</p>
                                        <p className="mt-3 text-2xl font-bold text-[#4A4036]">{orderTrendStats.peakPoint?.label || 'No data'}</p>
                                        <p className="mt-2 text-sm text-[#A68A64]">{orderTrendStats.peakPoint?.value || 0} orders at peak</p>
                                    </div>

                                    <div className="rounded-2xl bg-white border border-[#E0D8CC] p-6 shadow-sm">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A68A64]">Average orders</p>
                                        <p className="mt-3 text-2xl font-bold text-[#4A4036]">{orderTrendStats.average.toFixed(1)}</p>
                                        <p className="mt-2 text-sm text-[#4A4036]/70">Per selected interval bucket</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <RevenueOverviewCard
                    data={revenueOverviewData}
                    loading={revenueOverviewLoading}
                    error={revenueOverviewError}
                    period={revenueOverviewPeriod}
                    onPeriodChange={setRevenueOverviewPeriod}
                />

                {/* Recent Activity Table */}
                <div className="bg-white rounded-[8px] shadow-sm border border-[#E0D8CC] overflow-hidden">
                    <div className="p-8 border-b border-[#FAF7F2] flex justify-between items-center bg-[#F5F5F5]/30">
                        <h2 className="text-lg font-bold text-[#4A4036] uppercase tracking-tighter">Recent Orders</h2>
                        <button className="text-[#A68A64] font-black uppercase tracking-widest text-[10px] hover:text-[#4A4036] transition-colors border-b border-[#A68A64]">
                            View All Transactions
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#FAF7F2] text-[#A68A64] text-[10px] uppercase font-black tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Order ID</th>
                                    <th className="px-8 py-5">Customer</th>
                                    <th className="px-8 py-5">Product</th>
                                    <th className="px-8 py-5">Amount</th>
                                    <th className="px-8 py-5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E0D8CC]/50">
                                {recentOrders.length > 0 ? (
                                    recentOrders.map((order) => (
                                        <tr key={order._id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                                            <td className="px-8 py-6 font-bold text-[#4A4036] text-sm">
                                                #{order._id.substring(order._id.length - 8).toUpperCase()}
                                            </td>
                                            <td className="px-8 py-6 text-[#4A4036]/80 text-sm font-medium">
                                                {order.user?.fullName || 'Guest'}
                                            </td>
                                            <td className="px-8 py-6 text-[#4A4036]/80 text-sm">
                                                <span className="font-semibold">{order.orderItems?.[0]?.name || 'Unknown'}</span>
                                                {order.orderItems?.length > 1 && (
                                                    <span className="text-[#A68A64] text-[10px] ml-1">
                                                        +{order.orderItems.length - 1} others
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-[#4A4036] font-bold">
                                                ₹{order.totalPrice.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getOrderStatusInfo(order).className}`}>
                                                    {getOrderStatusInfo(order).label}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-16 text-center text-[#A68A64] font-medium italic">
                                            No recent activity to report.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;