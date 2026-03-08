import { useState, useEffect } from 'react';
import { Search, CheckCircle, Bell, ShoppingBag, Loader2 } from 'lucide-react';
import { getAllOrders, updateOrderStatus } from '../services/orderService';
import io from 'socket.io-client';

const DistributorDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchOrders();

        const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
        socket.on('order_received', (data) => {
            console.log("Distributor: New order notification!", data);
            fetchOrders(); // Refresh list automatically
        });

        return () => socket.disconnect();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await getAllOrders();
            setOrders(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch orders", error);
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId, status) => {
        setProcessingId(orderId);
        try {
            await updateOrderStatus(orderId, status);
            fetchOrders(); // Refresh list
        } catch (error) {
            alert("Failed to update order status");
        } finally {
            setProcessingId(null);
        }
    };

    const filteredOrders = orders.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;

    if (loading) return <div>Loading distributor portal...</div>;

    return (
        <div className="container">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1>Distributor Hub</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Live order verification and distribution</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--bg-accent)' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success)', animation: 'pulse 2s infinite' }}></div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Live Sync Active</span>
                </div>
            </header>

            <div className="stats-grid">
                <div className="card stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="stat-value">{pendingOrdersCount}</div>
                        <ShoppingBag color="var(--warning)" />
                    </div>
                    <div className="stat-label">Orders to Serve</div>
                </div>
                <div className="card stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="stat-value">{orders.filter(o => o.status === 'Served').length}</div>
                        <CheckCircle color="var(--success)" />
                    </div>
                    <div className="stat-label">Successfully Served</div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '2rem', padding: 0 }}>
                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bg-accent)' }}>
                    <h3 style={{ margin: 0 }}>Pending Checkouts</h3>
                    <div className="search-bar" style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search by Bill ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--bg-accent)',
                                minWidth: '300px'
                            }}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--bg-accent)', backgroundColor: 'var(--bg-primary)' }}>
                                <th style={{ padding: '1rem' }}>Bill ID</th>
                                <th style={{ padding: '1rem' }}>Items</th>
                                <th style={{ padding: '1rem' }}>Total Amount</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No orders found</td></tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid var(--bg-accent)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{order.id}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                {order.items.map((item, i) => (
                                                    <span key={i} style={{ padding: '0.2rem 0.4rem', backgroundColor: 'var(--bg-accent)', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                        {item.qty}x {item.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: '600' }}>₹{order.total}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                backgroundColor: order.status === 'Pending' ? 'var(--warning)15' : 'var(--success)15',
                                                color: order.status === 'Pending' ? 'var(--warning)' : 'var(--success)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }}></div>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {order.status === 'Pending' && (
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}
                                                    onClick={() => handleUpdateStatus(order.id, 'Served')}
                                                    disabled={processingId === order.id}
                                                >
                                                    {processingId === order.id ? <Loader2 className="animate-spin" size={14} /> : 'Complete Order'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DistributorDashboard;
