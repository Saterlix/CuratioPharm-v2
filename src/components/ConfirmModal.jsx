import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'normal' }) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay">
            <div className="confirm-modal">
                <div className="confirm-modal-header">
                    <div className={`confirm-icon confirm-icon--${type}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <button className="confirm-close-btn" onClick={onCancel}>
                        <X size={20} />
                    </button>
                </div>
                
                <div className="confirm-modal-content">
                    <h3>{title}</h3>
                    <p>{message}</p>
                </div>
                
                <div className="confirm-modal-actions">
                    <button className="btn btn--secondary" onClick={onCancel}>
                        Отмена
                    </button>
                    <button 
                        className={`btn ${type === 'danger' ? 'btn--danger' : 'btn--primary'}`}
                        onClick={onConfirm}
                    >
                        Подтвердить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
