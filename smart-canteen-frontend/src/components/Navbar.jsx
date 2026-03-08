import { Bell, ShoppingCart, Menu as MenuIcon, X, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const Navbar = ({ toggleSidebar }) => {
    const { cart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [incomingNotif, setIncomingNotif] = useState(null);

    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    const playNotificationSound = () => {
        try {
            // Simple beep sound using data URI to avoid external dependencies
            const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU");
            // A clearer notification sound (short ping)
            audio.src = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
            audio.play().catch(e => console.log("Audio play failed (user interaction needed first):", e));
        } catch (e) {
            console.error("Sound error", e);
        }
    };

    useEffect(() => {
        const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000');

        socket.on('order_received', (data) => {
            if (user?.role === 'distributor' || user?.role === 'admin') {
                playNotificationSound();
                const newNotif = {
                    id: Date.now(),
                    title: 'New Order Received!',
                    message: `Order ${data.orderId} from ${data.userName}`,
                    time: new Date().toLocaleTimeString(),
                    type: 'order'
                };
                setNotifications(prev => [newNotif, ...prev]);
                setIncomingNotif(newNotif);

                setTimeout(() => setIncomingNotif(null), 5000);
            }
        });

        socket.on('order_status_updated', (data) => {
            if (user?.id === data.userId) {
                playNotificationSound();
                const newNotif = {
                    id: Date.now(),
                    title: 'Order Updated!',
                    message: `Your order ${data.orderId} is now ${data.status}`,
                    time: new Date().toLocaleTimeString(),
                    type: 'order'
                };
                setNotifications(prev => [newNotif, ...prev]);
                setIncomingNotif(newNotif);
                setTimeout(() => setIncomingNotif(null), 5000);
            }
        });

        return () => socket.disconnect();
    }, [user]);

    return (
        <header className="top-navbar">
            <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="btn icon-btn" onClick={toggleSidebar}>
                    <MenuIcon size={24} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.4rem', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex' }}>
                        <Sparkles size={20} className="logo-icon" />
                    </div>
                    <h2 className="current-page-title" style={{ fontSize: '1.4rem', fontFamily: '"Outfit", sans-serif', fontWeight: '800', letterSpacing: '-0.5px' }}>CampusCard</h2>
                </div>
            </div>

            <div className="nav-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ position: 'relative' }}>
                    <button className="btn icon-btn" style={{ padding: '0.6rem' }} onClick={() => setShowNotifPanel(!showNotifPanel)}>
                        <Bell size={22} />
                        {notifications.length > 0 && (
                            <span className="badge" style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--danger)', color: 'white', borderRadius: '50%', minWidth: '18px', height: '18px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                                {notifications.length}
                            </span>
                        )}
                    </button>

                    {showNotifPanel && (
                        <div className="card" style={{ position: 'absolute', top: '100%', right: 0, width: '320px', marginTop: '1rem', zIndex: 100, padding: 0, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid var(--bg-accent)' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--bg-accent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0 }}>Notifications</h4>
                                <button className="btn" onClick={() => setNotifications([])} style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Clear all</button>
                            </div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No new notifications</p>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} style={{ padding: '1rem', borderBottom: '1px solid var(--bg-accent)', backgroundColor: n.id === notifications[0].id ? 'var(--primary-light)20' : 'transparent' }}>
                                            <div style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{n.title}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{n.message}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{n.time}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {user?.role === 'student' && (
                    <button
                        className="btn icon-btn"
                        style={{ padding: '0.6rem', position: 'relative' }}
                        onClick={() => navigate('/cart')}
                    >
                        <ShoppingCart size={22} />
                        {totalItems > 0 && (
                            <span className="badge" style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '22px', height: '22px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                                {totalItems}
                            </span>
                        )}
                    </button>
                )}
            </div>

            {/* Real-time Toast Notification Overlay */}
            {incomingNotif && (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, animation: 'slideIn 0.3s ease-out' }}>
                    <div className="card glass-morphism" style={{ borderLeft: '4px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
                        <div>
                            <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{incomingNotif.title}</div>
                            <div style={{ fontSize: '0.9rem' }}>{incomingNotif.message}</div>
                        </div>
                        <button className="btn" onClick={() => setIncomingNotif(null)}><X size={18} /></button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
