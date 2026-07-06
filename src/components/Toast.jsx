import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';
import './Toast.css';

const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />
};

const Toast = ({ id, message, type = 'info', duration = 3000, onClose }) => {
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLeaving(true);
        }, duration);
        
        return () => clearTimeout(timer);
    }, [duration]);

    useEffect(() => {
        if (isLeaving) {
            const timer = setTimeout(() => onClose(id), 300); // Wait for animation
            return () => clearTimeout(timer);
        }
    }, [isLeaving, id, onClose]);

    return (
        <div className={`toast toast--${type} ${isLeaving ? 'toast--leaving' : ''}`}>
            <div className="toast-icon">{icons[type]}</div>
            <div className="toast-message">{message}</div>
            <button className="toast-close" onClick={() => setIsLeaving(true)}>
                <X size={16} />
            </button>
        </div>
    );
};

export default Toast;
