import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { isBackofficeRole, isDeveloperRole } from '../utils/roles';

const AuthContext = createContext();

const needsPasswordChange = (user) =>
    Boolean(user?.must_change_password || user?.mustChangePassword);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isDeveloper, setIsDeveloper] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mustChangePassword, setMustChangePassword] = useState(false);

    // Check if user is already logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const isValid = await authAPI.verifyToken();
                    if (isValid) {
                        const storedUser = authAPI.getStoredUser();
                        setIsAuthenticated(true);
                        setUser(storedUser);
                        setIsAdmin(isBackofficeRole(storedUser?.role));
                        setIsDeveloper(isDeveloperRole(storedUser?.role));
                        setMustChangePassword(needsPasswordChange(storedUser));
                    } else {
                        authAPI.logout();
                    }
                } catch (err) {
                    console.error('Auth check failed:', err);
                    // Don't logout on network errors — keep stored session
                    const storedUser = authAPI.getStoredUser();
                    if (storedUser) {
                        setIsAuthenticated(true);
                        setUser(storedUser);
                        setIsAdmin(isBackofficeRole(storedUser?.role));
                        setIsDeveloper(isDeveloperRole(storedUser?.role));
                        setMustChangePassword(needsPasswordChange(storedUser));
                    }
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    // Partner login
    const login = async (loginStr, password) => {
        setError(null);
        try {
            const data = await authAPI.login(loginStr, password);
            setIsAuthenticated(true);
            setUser(data.user);
            setIsAdmin(isBackofficeRole(data.user.role));
            setIsDeveloper(isDeveloperRole(data.user.role));
            setMustChangePassword(needsPasswordChange(data.user));
            return { success: true, must_change_password: needsPasswordChange(data.user), user: data.user };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    // OTP login
    const loginOtp = async (code) => {
        setError(null);
        try {
            const data = await authAPI.loginOtp(code);
            setIsAuthenticated(true);
            setUser(data.user);
            setIsAdmin(isBackofficeRole(data.user.role));
            setIsDeveloper(isDeveloperRole(data.user.role));
            setMustChangePassword(true); // OTP always requires password change
            return { success: true, must_change_password: true, user: data.user };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    // Change password (after OTP)
    const changePassword = async (newPassword) => {
        setError(null);
        try {
            const data = await authAPI.changePassword(newPassword);
            setMustChangePassword(false);
            // Update user object
            setUser(prev => ({ ...(data.user || prev), must_change_password: false, mustChangePassword: false }));
            return { success: true, user: data.user };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    // Admin login
    const adminLogin = async (loginStr, password, adminKey) => {
        setError(null);
        try {
            const data = await authAPI.adminLogin(loginStr, password, adminKey);
            setIsAuthenticated(true);
            setUser(data.user);
            setIsAdmin(isBackofficeRole(data.user.role));
            setIsDeveloper(isDeveloperRole(data.user.role));
            setMustChangePassword(needsPasswordChange(data.user));
            return { success: true, user: data.user };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    // Logout
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAdmin');
        setIsAuthenticated(false);
        setUser(null);
        setIsAdmin(false);
        setIsDeveloper(false);
        setMustChangePassword(false);
        setError(null);
    };

    // Register request
    const registerRequest = async (companyName, contactPerson, phone, email) => {
        setError(null);
        try {
            const data = await authAPI.registerRequest(companyName, contactPerson, phone, email);
            return { success: true, message: data.message };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const value = {
        isAuthenticated,
        isAdmin,
        isDeveloper,
        user,
        loading,
        error,
        mustChangePassword,
        login,
        loginOtp,
        changePassword,
        adminLogin,
        logout,
        registerRequest
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
