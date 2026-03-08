import { useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { requestNotificationPermission, sendNotification } from '../services/notificationService';

const NotificationHandler = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        console.log('NotificationHandler initialized for user:', user.id);

        // Request permission
        requestNotificationPermission().then(granted => {
            console.log('Notification permission granted:', granted);
        });

        const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');

        socket.on('connect', () => {
            console.log('Socket connected to backend for notifications');
        });

        // Listen for order status updates
        socket.on('order_status_updated', (data) => {
            console.log('Order status update received:', data);
            const { userId, orderId, status } = data;

            // LOOSE EQUALITY intentionally to handle string/number comparison
            if (String(userId) === String(user.id)) {
                console.log(`Matching order update for current user. Status: ${status}`);
                if (status === 'Served') {
                    sendNotification('🍽️ Order Ready!', {
                        body: `Your order ${orderId} has been served. Enjoy your meal!`,
                        tag: orderId,
                        requireInteraction: true // Keeps notification visible until user clicks
                    });
                }
            }
        });

        // Other listeners...
        socket.on('order_received', (data) => {
            if (user.role === 'admin' || user.role === 'distributor') {
                sendNotification('📦 New Order Received', {
                    body: `Order ${data.orderId} from ${data.userName} for ₹${data.total}`,
                });
            }
        });

        socket.on('new_complaint', (data) => {
            if (user.role === 'admin') {
                sendNotification('⚠️ New Complaint', {
                    body: `A new feedback/complaint was submitted by ${data.name}.`,
                });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [user?.id]); // Depend on user ID

    return null;
};

export default NotificationHandler;
