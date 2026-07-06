import React, { createContext, useContext, useState, useEffect } from 'react';

const PageStyleContext = createContext();

export const usePageStyle = () => useContext(PageStyleContext);

export const PageStyleProvider = ({ children }) => {
    const [isNatureStyle, setIsNatureStyle] = useState(() => {
        return localStorage.getItem('cp-page-style') === 'nature';
    });

    useEffect(() => {
        localStorage.setItem('cp-page-style', isNatureStyle ? 'nature' : 'classic');
    }, [isNatureStyle]);

    const toggle = () => setIsNatureStyle(v => !v);

    return (
        <PageStyleContext.Provider value={{ isNatureStyle, toggle }}>
            {children}
        </PageStyleContext.Provider>
    );
};

export default PageStyleContext;
