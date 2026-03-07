import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
const ADMIN_PASS = 'niat2026admin';

// ─── Colors ───────────────────────────────────────────────────────────────────
const COLORS = {
    scratch_revealed: '#7b1fa2',
    scratch_continued: '#1565c0',
    photo_uploaded: '#2e7d32',
    card_download: '#e65100',
    card_share: '#991B1C',
    carousel_download: '#4a148c',
    carousel_share: '#00695c',
};

const EVENT_META = {
    scratch_revealed: { label: 'Scratch Revealed', icon: '🎴' },
    scratch_continued: { label: 'Continued to Card', icon: '➡️' },
    photo_uploaded: { label: 'Photo Uploaded', icon: '📸' },
    card_download: { label: 'Card Downloaded', icon: '⬇️' },
    card_share: { label: 'Card Shared', icon: '📤' },
    carousel_download: { label: 'Greeting Downloaded', icon: '🎨' },
    carousel_share: { label: 'Greeting Shared', icon: '🔗' },
};

async function fetchEvents() {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/events?select=event_type,created_at&order=created_at.desc`,
        {
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
            },
        }
    );
    if (!res.ok) throw new Error('Fetch failed');
    return res.json();
}

// ─── Custom label for pie slices ──────────────────────────────────────────────
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.04) return null; // skip tiny slices
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'system-ui' }}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export default function AdminDashboard() {
    const [authed, setAuthed] = useState(false);
    const [password, setPassword] = useState('');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === ADMIN_PASS) setAuthed(true);
        else alert('Wrong password');
    };

    const load = async () => {
        setLoading(true); setError(null);
        try {
            const data = await fetchEvents();
            setEvents(data);
            setLastRefresh(new Date());
        } catch (err) {
            console.error(err);
            setError('Failed to load. Check Supabase config.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (authed) load(); }, [authed]);

    // ── Aggregate counts ────────────────────────────────────────────────────────
    const counts = events.reduce((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
    }, {});

    // ── Pie chart data sets ──────────────────────────────────────────────────────

    // Chart 1 — All events distribution
    const allEventsPie = Object.entries(counts).map(([key, value]) => ({
        name: EVENT_META[key]?.label || key,
        value,
        color: COLORS[key] || '#999',
    }));

    // Chart 2 — Share vs Download comparison
    const shareVsDownload = [
        { name: 'Card Shared', value: counts.card_share || 0, color: '#991B1C' },
        { name: 'Card Downloaded', value: counts.card_download || 0, color: '#e65100' },
        { name: 'Greeting Shared', value: counts.carousel_share || 0, color: '#00695c' },
        { name: 'Greeting Downloaded', value: counts.carousel_download || 0, color: '#4a148c' },
    ].filter(d => d.value > 0);

    // Chart 3 — Funnel completion (how many made it to each step)
    const funnelPie = [
        { name: 'Scratch Revealed', value: counts.scratch_revealed || 0, color: '#7b1fa2' },
        { name: 'Continued to Card', value: counts.scratch_continued || 0, color: '#1565c0' },
        { name: 'Photo Uploaded', value: counts.photo_uploaded || 0, color: '#2e7d32' },
        {
            name: 'Card Shared/Downloaded',
            value: (counts.card_share || 0) + (counts.card_download || 0), color: '#991B1C'
        },
    ].filter(d => d.value > 0);

    // Chart 4 — Activity by day of week (last 30 days)
    const byDay = events.reduce((acc, e) => {
        const date = new Date(e.created_at);
        const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
        acc[dayName] = (acc[dayName] || 0) + 1;
        return acc;
    }, {});
    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const DAY_COLORS = ['#c62828', '#d84315', '#e65100', '#f57c00', '#f9a825', '#558b2f', '#1565c0'];
    const dayPie = dayOrder
        .filter(d => byDay[d])
        .map((d, i) => ({ name: d, value: byDay[d], color: DAY_COLORS[i] }));

    // ─── Login screen ──────────────────────────────────────────────────────────
    if (!authed) {
        return (
            <div style={{
                width: '100vw', height: '100vh', background: '#FFF1CC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <form onSubmit={handleLogin} style={{
                    background: 'white', borderRadius: '20px',
                    padding: '48px 36px',
                    boxShadow: '0 8px 40px rgba(153,27,28,0.18)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '18px', width: '320px',
                }}>
                    <div style={{ fontSize: '40px' }}>🔒</div>
                    <div style={{
                        fontFamily: 'Georgia, serif', fontSize: '22px',
                        fontWeight: '700', color: '#991B1C',
                    }}>Admin Access</div>
                    <div style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>
                        NIAT Women's Day · Analytics
                    </div>
                    <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 16px',
                            border: '1.5px solid #e0d0d0', borderRadius: '10px',
                            fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                            fontFamily: 'system-ui',
                        }}
                        autoFocus
                    />
                    <button type="submit" style={{
                        width: '100%', padding: '14px',
                        background: '#991B1C', color: 'white',
                        border: 'none', borderRadius: '10px',
                        fontSize: '15px', fontWeight: '700', cursor: 'pointer',
                        letterSpacing: '0.02em',
                    }}>
                        Enter Dashboard →
                    </button>
                </form>
            </div>
        );
    }

    // ─── Dashboard ─────────────────────────────────────────────────────────────
    const cardStyle = {
        background: 'white', borderRadius: '16px', padding: '24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    };

    const headingStyle = {
        fontSize: '15px', fontWeight: '700', color: '#333',
        marginBottom: '4px',
    };

    const subStyle = {
        fontSize: '12px', color: '#999', marginBottom: '20px',
    };

    return (
        <div style={{
            minHeight: '100vh', background: '#f8f4ee',
            fontFamily: 'system-ui, sans-serif',
            padding: '28px 20px 60px', boxSizing: 'border-box',
        }}>
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>

                {/* ── Header ─────────────────────────────────────────────── */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: '28px',
                    flexWrap: 'wrap', gap: '12px',
                }}>
                    <div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#991B1C' }}>
                            📊  NIAT Women's Day — Analytics
                        </div>
                        {lastRefresh && (
                            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '3px' }}>
                                Last updated: {lastRefresh.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                    <button onClick={load} disabled={loading} style={{
                        padding: '10px 22px', background: '#991B1C', color: 'white',
                        border: 'none', borderRadius: '999px', cursor: 'pointer',
                        fontSize: '14px', fontWeight: '600', opacity: loading ? 0.6 : 1,
                    }}>
                        {loading ? '⏳  Loading...' : '🔄  Refresh'}
                    </button>
                </div>

                {error && (
                    <div style={{
                        background: '#ffebee', border: '1px solid #ef9a9a',
                        borderRadius: '10px', padding: '12px 16px',
                        color: '#c62828', marginBottom: '20px', fontSize: '14px',
                    }}>⚠️ {error}</div>
                )}

                {/* ── KPI row ────────────────────────────────────────────── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '14px', marginBottom: '24px',
                }}>
                    {[
                        { label: 'Total Events', value: events.length, icon: '🎯', color: '#991B1C' },
                        { label: 'Cards Shared', value: counts.card_share || 0, icon: '📤', color: '#2e7d32' },
                        { label: 'Cards Downloaded', value: counts.card_download || 0, icon: '⬇️', color: '#e65100' },
                        { label: 'Photos Uploaded', value: counts.photo_uploaded || 0, icon: '📸', color: '#1565c0' },
                        { label: 'Scratches', value: counts.scratch_revealed || 0, icon: '🎴', color: '#7b1fa2' },
                    ].map((kpi, i) => (
                        <div key={i} style={{
                            ...cardStyle, padding: '18px 16px',
                            borderTop: `4px solid ${kpi.color}`,
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '6px' }}>{kpi.icon}</div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: kpi.color, lineHeight: 1 }}>
                                {kpi.value.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '5px', lineHeight: 1.4 }}>
                                {kpi.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Pie charts row 1 ───────────────────────────────────── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px', marginBottom: '20px',
                }}>

                    {/* Chart 1 — All events distribution */}
                    <div style={cardStyle}>
                        <div style={headingStyle}>🥧  All Events Distribution</div>
                        <div style={subStyle}>Every tracked action, by type</div>
                        {allEventsPie.length === 0 ? (
                            <NoData />
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={allEventsPie}
                                        cx="50%" cy="50%"
                                        innerRadius={55} outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderCustomLabel}
                                    >
                                        {allEventsPie.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [value.toLocaleString(), name]}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #eee', fontSize: '13px' }}
                                    />
                                    <Legend
                                        iconType="circle" iconSize={8}
                                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Chart 2 — Share vs Download */}
                    <div style={cardStyle}>
                        <div style={headingStyle}>📤  Share vs Download</div>
                        <div style={subStyle}>How users chose to save their cards</div>
                        {shareVsDownload.length === 0 ? (
                            <NoData />
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={shareVsDownload}
                                        cx="50%" cy="50%"
                                        innerRadius={55} outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderCustomLabel}
                                    >
                                        {shareVsDownload.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [value.toLocaleString(), name]}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #eee', fontSize: '13px' }}
                                    />
                                    <Legend
                                        iconType="circle" iconSize={8}
                                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* ── Pie charts row 2 ───────────────────────────────────── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px', marginBottom: '20px',
                }}>

                    {/* Chart 3 — User journey funnel as pie */}
                    <div style={cardStyle}>
                        <div style={headingStyle}>🔄  User Journey Funnel</div>
                        <div style={subStyle}>How many users completed each step</div>
                        {funnelPie.length === 0 ? (
                            <NoData />
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={funnelPie}
                                        cx="50%" cy="50%"
                                        innerRadius={0} outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderCustomLabel}
                                    >
                                        {funnelPie.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [value.toLocaleString(), name]}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #eee', fontSize: '13px' }}
                                    />
                                    <Legend
                                        iconType="circle" iconSize={8}
                                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Chart 4 — Activity by day of week */}
                    <div style={cardStyle}>
                        <div style={headingStyle}>📅  Activity by Day of Week</div>
                        <div style={subStyle}>Which days users are most active</div>
                        {dayPie.length === 0 ? (
                            <NoData />
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={dayPie}
                                        cx="50%" cy="50%"
                                        innerRadius={45} outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderCustomLabel}
                                    >
                                        {dayPie.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [`${value} events`, name]}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #eee', fontSize: '13px' }}
                                    />
                                    <Legend
                                        iconType="circle" iconSize={8}
                                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* ── Recent events log ──────────────────────────────────── */}
                <div style={cardStyle}>
                    <div style={headingStyle}>🕐  Recent Events</div>
                    <div style={subStyle}>Last 50 individual actions</div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f5eded' }}>
                                    {['#', 'Event', 'Time'].map(h => (
                                        <th key={h} style={{
                                            textAlign: 'left', padding: '8px 12px',
                                            color: '#888', fontWeight: '600', fontSize: '12px',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {events.slice(0, 50).map((e, i) => {
                                    const meta = EVENT_META[e.event_type] || { icon: '•', label: e.event_type };
                                    const color = COLORS[e.event_type] || '#888';
                                    return (
                                        <tr key={i} style={{
                                            borderBottom: '1px solid #fdf5f5',
                                            background: i % 2 === 0 ? 'transparent' : '#fdf9f9',
                                        }}>
                                            <td style={{ padding: '9px 12px', color: '#ccc', fontSize: '12px' }}>{i + 1}</td>
                                            <td style={{ padding: '9px 12px' }}>
                                                <span style={{ marginRight: '8px' }}>{meta.icon}</span>
                                                <span style={{ color, fontWeight: '600' }}>{meta.label}</span>
                                            </td>
                                            <td style={{ padding: '9px 12px', color: '#999', fontSize: '12px' }}>
                                                {new Date(e.created_at).toLocaleString('en-IN', {
                                                    day: '2-digit', month: 'short',
                                                    hour: '2-digit', minute: '2-digit',
                                                })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ textAlign: 'center', color: '#ccc', fontSize: '11px', marginTop: '32px' }}>
                    NIAT Admin · Women's Day 2026 · Only accessible at /admin
                </div>
            </div>
        </div>
    );
}

function NoData() {
    return (
        <div style={{
            height: '200px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#ccc', fontSize: '14px', flexDirection: 'column', gap: '8px',
        }}>
            <div style={{ fontSize: '32px' }}>📭</div>
            No data yet
        </div>
    );
}
