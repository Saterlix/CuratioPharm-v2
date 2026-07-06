import React from 'react';
import { usePageStyle } from '../context/PageStyleContext';
import './StyleToggle.css';

const StyleToggle = () => {
    const { isNatureStyle, toggle } = usePageStyle();

    return (
        <div className={`style-toggle-wrap ${isNatureStyle ? 'on' : 'off'}`}>
            {/* Glow ring when active */}
            {isNatureStyle && <div className="st-glow-ring" />}

            <button
                className="style-toggle-btn"
                onClick={toggle}
                title={isNatureStyle ? 'Выключить тёмный стиль' : 'Включить тёмный стиль'}
                aria-label="Переключить стиль страниц"
            >
                {/* Icon */}
                <span className="st-icon">
                    {isNatureStyle ? (
                        /* Moon / dark */
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/>
                        </svg>
                    ) : (
                        /* Sun / light */
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="4" fill="currentColor"/>
                            <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    )}
                </span>

                {/* Track */}
                <span className="st-track">
                    <span className="st-thumb" />
                </span>

                {/* Text */}
                <span className="st-text">
                    {isNatureStyle ? 'Тёмный' : 'Светлый'}
                </span>
            </button>
        </div>
    );
};

export default StyleToggle;
