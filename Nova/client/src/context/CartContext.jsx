import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchCart = async () => {
        if (!user) {
            setCart(null);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get('/cart');
            setCart(res.data.data.cart);
        } catch (err) {
            console.error('Error fetching cart:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, [user]);

    const addToCart = async (productId, quantity = 1) => {
        try {
            const res = await api.post('/cart/add', { productId, quantity });
            setCart(res.data.data.cart);
            return res.data;
        } catch (err) {
            console.error('Error adding to cart:', err);
            throw err;
        }
    };

    const updateQuantity = async (productId, quantity) => {
        try {
            const res = await api.put('/cart/update', { productId, quantity });
            setCart(res.data.data.cart);
            return res.data;
        } catch (err) {
            console.error('Error updating quantity:', err);
            throw err;
        }
    };

    const removeFromCart = async (productId) => {
        try {
            const res = await api.delete(`/cart/remove/${productId}`);
            setCart(res.data.data.cart);
            return res.data;
        } catch (err) {
            console.error('Error removing from cart:', err);
            throw err;
        }
    };

    const clearCart = async () => {
        try {
            await api.delete('/cart/clear');
            setCart({ items: [] });
        } catch (err) {
            console.error('Error clearing cart:', err);
            throw err;
        }
    };

    const cartCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
    const cartItems = cart?.items || [];
    const cartTotal = cartItems.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            cartItems,
            cartCount,
            cartTotal,
            loading,
            addToCart,
            updateQuantity,
            removeFromCart,
            clearCart,
            fetchCart
        }}>
            {children}
        </CartContext.Provider>
    );
};
