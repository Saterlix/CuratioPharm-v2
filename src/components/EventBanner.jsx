import React, { useEffect, useState } from 'react';
import { X, ArrowRight, Megaphone } from 'lucide-react';
import api from '../services/api';
import './EventBanner.css';

const readDismissedEvents = () => {
    try {
        const saved = sessionStorage.getItem('dismissed_events');
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
};

const EventBanner = () => {
    const [events, setEvents] = useState([]);
    const [dismissedEvents, setDismissedEvents] = useState(readDismissedEvents);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await api.get('/events/active');
                setEvents(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error('Failed to fetch active events:', err);
            }
        };

        fetchEvents();
    }, []);

    const dismissEvent = (id) => {
        const updated = [...dismissedEvents, id];
        setDismissedEvents(updated);
        try {
            sessionStorage.setItem('dismissed_events', JSON.stringify(updated));
        } catch (err) {
            console.error(err);
        }
    };

    const activeEvents = events.filter((event) => !dismissedEvents.includes(event.id));
    if (activeEvents.length === 0) return null;

    return (
        <div className="event-notifications-container">
            {activeEvents.map((event) => {
                const eventStyle = {
                    backgroundColor: event.background_color || 'var(--primary)',
                    color: event.text_color || '#ffffff'
                };

                if (event.type === 'ribbon') {
                    return (
                        <div key={event.id} className="event-ribbon" style={eventStyle}>
                            <div className="event-ribbon-track">
                                {[0, 1].map((copy) => (
                                    <span key={copy} className="event-ribbon-text">
                                        <Megaphone className="ribbon-icon" />
                                        {event.title} - {event.description}
                                        {event.link_url && (
                                            <a href={event.link_url}>
                                                Подробнее <ArrowRight size={12} />
                                            </a>
                                        )}
                                    </span>
                                ))}
                            </div>
                            <button type="button" onClick={() => dismissEvent(event.id)} className="event-ribbon-close" title="Скрыть">
                                <X />
                            </button>
                        </div>
                    );
                }

                if (event.type === 'banner') {
                    return (
                        <div key={event.id} className="event-banner" style={eventStyle}>
                            {event.image_url && (
                                <img className="event-banner-image" src={event.image_url} alt={event.title} />
                            )}
                            <div className="event-banner-content">
                                <h4 className="event-banner-title">{event.title}</h4>
                                <p className="event-banner-description">{event.description}</p>
                                {event.link_url && (
                                    <a href={event.link_url} className="event-banner-link">
                                        Подробнее <ArrowRight />
                                    </a>
                                )}
                            </div>
                            <button type="button" onClick={() => dismissEvent(event.id)} className="event-banner-close" title="Закрыть">
                                <X />
                            </button>
                        </div>
                    );
                }

                if (event.type === 'popup') {
                    return (
                        <div key={event.id} className="event-popup-overlay">
                            <div className="event-popup" style={{ borderTop: `6px solid ${event.background_color || 'var(--primary)'}` }}>
                                <button type="button" onClick={() => dismissEvent(event.id)} className="event-popup-close" title="Закрыть">
                                    <X />
                                </button>
                                {event.image_url ? (
                                    <div className="event-popup-image-wrapper">
                                        <img className="event-popup-image" src={event.image_url} alt={event.title} />
                                    </div>
                                ) : (
                                    <div className="event-popup-no-image">
                                        <Megaphone />
                                    </div>
                                )}
                                <div className="event-popup-body">
                                    <h3 className="event-popup-title">{event.title}</h3>
                                    <p className="event-popup-description">{event.description}</p>
                                    <div className="event-popup-actions">
                                        {event.link_url && (
                                            <a href={event.link_url} className="event-popup-link" style={eventStyle}>
                                                Узнать больше
                                            </a>
                                        )}
                                        <button type="button" className="event-popup-dismiss" onClick={() => dismissEvent(event.id)}>
                                            Закрыть
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
};

export default EventBanner;
