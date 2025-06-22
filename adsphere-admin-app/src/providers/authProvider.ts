import type {AuthProvider} from "@refinedev/core";
import { API_URL } from "../api";

export const TOKEN_KEY = "accessToken";

export const authProvider: AuthProvider = {
    login: async ({email, password}) => {
        if (email && password) {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            console.log(data);
            if (response.ok) {
                localStorage.setItem(TOKEN_KEY, data.accessToken);
                return {
                    success: true,
                    redirectTo: "/",
                };
            }
        }

        return {
            success: false,
            error: {
                name: "LoginError",
                message: "Invalid username or password",
            },
        };
    },
    logout: async () => {
        localStorage.removeItem(TOKEN_KEY);
        return {
            success: true,
            redirectTo: "/login",
        };
    },
    check: async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            const response = await fetch(`${API_URL}/auth/me`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();

            return {
                authenticated: true,
            };
        }

        return {
            authenticated: false,
            redirectTo: "/login",
        };
    },
    getPermissions: async () => null,
    getIdentity: async () => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            const response = await fetch(`${API_URL}/auth/me`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();

            return {
                id: data.id,
                name: data.email,
                // avatar: "https://i.pravatar.cc/300",
            };
        }

        return null;
    },
    onError: async (error) => {
        console.error(error);
        return {error};
    },
};
