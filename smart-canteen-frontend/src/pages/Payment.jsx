import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Loader2, ShoppingBag, CreditCard, Zap } from 'lucide-react';
import { createOrder } from '../services/orderService';
import { createRazorpayOrder, verifyRazorpayPayment } from '../services/paymentService';
import io from 'socket.io-client';

const Payment = () => {
    const { cart, total, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('pending'); // pending, processing, success

    // Test Mode - Complete Order Instantly
    const handleTestMode = async () => {
        setStatus('processing');

        try {
            const orderData = {
                userId: user.id,
                total: total,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    qty: item.quantity,
                    price: item.price
                })),
                isTestMode: true
            };

            const response = await createOrder(orderData);

            // Emit socket event for real-time notification to distributor/staff
            const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
            socket.emit('new_order', {
                orderId: response.data.id,
                items: orderData.items,
                userName: user.name,
                total: total
            });

            setStatus('success');
            clearCart();

            // Auto-redirect after 2 seconds
            setTimeout(() => {
                navigate('/orders');
            }, 2000);

        } catch (error) {
            console.error("Order Creation Error:", error);
            alert("Failed to create order. Please try again.");
            setStatus('pending');
        }
    };

    // Razorpay Mode - Real Payment
    const handleRazorpayPayment = async () => {
        setStatus('processing');

        try {
            const orderResponse = await createRazorpayOrder({
                amount: total,
                receipt: `receipt_${Date.now()}`
            });

            const { id: order_id, amount, currency } = orderResponse.data;

            const options = {
                key: 'rzp_test_SFfFd7GvtIYSn4',
                amount: amount,
                currency: currency,
                name: 'Smart Canteen',
                description: 'Payment for your meal',
                image: 'https://cdn-icons-png.flaticon.com/512/3565/3565418.png',
                order_id: order_id,
                handler: async function (response) {
                    try {
                        const verificationRes = await verifyRazorpayPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verificationRes.data.status === 'ok') {
                            await finalizeRazorpayOrder(total);
                        } else {
                            alert("Payment verification failed!");
                            setStatus('pending');
                        }
                    } catch (err) {
                        console.error("Verification Error:", err);
                        alert("Payment verification failed!");
                        setStatus('pending');
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                },
                theme: {
                    color: "#8b5cf6",
                },
                modal: {
                    ondismiss: function () {
                        setStatus('pending');
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error("Razorpay Error:", error);
            alert("Could not initialize payment. Please try again.");
            setStatus('pending');
        }
    };

    const finalizeRazorpayOrder = async (orderTotal) => {
        try {
            const orderData = {
                userId: user.id,
                total: orderTotal,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    qty: item.quantity,
                    price: item.price
                })),
                isTestMode: false
            };

            const response = await createOrder(orderData);

            const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
            socket.emit('new_order', {
                orderId: response.data.id,
                items: orderData.items,
                userName: user.name,
                total: orderTotal
            });

            setStatus('success');
            clearCart();

            setTimeout(() => {
                navigate('/orders');
            }, 2000);

        } catch (error) {
            console.error("Finalize Order Error:", error);
            alert("Payment recorded, but order creation failed. Please contact admin.");
        }
    };

    if (status === 'success') {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <div style={{
                    backgroundColor: 'var(--success)',
                    color: 'white',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 2rem',
                    animation: 'scaleUp 0.5s ease-out'
                }}>
                    <CheckCircle size={48} />
                </div>
                <h1>Order Placed Successfully!</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Your order has been sent to the canteen. You'll be notified when it's ready!
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/orders')}>
                    View My Orders
                </button>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '700px' }}>
            <button
                className="btn"
                style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => navigate('/cart')}
            >
                <ArrowLeft size={18} /> Back to Cart
            </button>

            <div className="card" style={{ padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>Complete Your Order</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Total Amount: <strong style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>₹{total.toFixed(2)}</strong>
                    </p>
                </div>

                {/* Order Summary */}
                <div style={{
                    backgroundColor: 'var(--bg-accent)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '2rem'
                }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Order Summary</h3>
                    {cart.map((item, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem'
                        }}>
                            <span>{item.quantity}x {item.name}</span>
                            <span style={{ fontWeight: 'bold' }}>₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                    <div style={{
                        borderTop: '1px solid var(--bg-primary)',
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                    }}>
                        <span>Total:</span>
                        <span style={{ color: 'var(--primary)' }}>₹{total}</span>
                    </div>
                </div>

                {/* Payment Options */}
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {/* Primary Mode: Direct Order */}
                    <button
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: '1.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
                        }}
                        onClick={handleTestMode}
                        disabled={status === 'processing'}
                    >
                        {status === 'processing' ? (
                            <>
                                <Loader2 className="animate-spin" size={20} /> Processing...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} /> Sample Order (Proceed)
                            </>
                        )}
                    </button>

                    {/* Prohibited Razorpay: Show Popup Only */}
                    <button
                        className="btn"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            fontSize: '1rem',
                            fontWeight: '500',
                            border: '1px solid var(--primary)',
                            backgroundColor: 'white',
                            color: 'var(--primary)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = 'var(--bg-accent)'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                        onClick={() => alert("Payment mode is currently unavailable. Real payments will be enabled soon. Please use 'Sample Order (Proceed)' for now.")}
                    >
                        <CreditCard size={18} /> Pay with Razorpay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Payment;
