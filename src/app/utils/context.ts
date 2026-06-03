import { useAuth } from "../store/auth/useAuth";

export function getRequiredAuth() {
    const token = useAuth.getState().session?.access_token;
    if (!token) {
        throw new Error("Session expired. Please log in again.");
    }
    return { token };
}
