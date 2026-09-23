/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

async function apiFetch(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

function scoresObjectToRows(scores = {}) {
  return Object.entries(scores).map(([game, score]) => ({ game, score }));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await apiFetch("/api/auth/me");
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (username, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    setUser(data.user);
    return data.user;
  };

  const signup = async (username, password) => {
    const data = await apiFetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  const fetchUsers = async (search = "") => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);

    const data = await apiFetch(`/api/users?${params.toString()}`);
    return data.users;
  };

  const fetchUserProfile = async (username) => {
    const data = await apiFetch(`/api/users/${encodeURIComponent(username)}`);
    return data.user;
  };

  const addFriend = async (friendUsername) => {
    const data = await apiFetch("/api/friends", {
      method: "POST",
      body: JSON.stringify({ friendUsername }),
    });

    setUser(data.user);
    return data.user;
  };

  const removeFriend = async (friendUsername) => {
    const data = await apiFetch("/api/friends", {
      method: "DELETE",
      body: JSON.stringify({ friendUsername }),
    });

    setUser(data.user);
    return data.user;
  };

  const fetchFriends = async () => {
    const data = await apiFetch("/api/users");
    return data.users.filter((candidate) => candidate.isFriend);
  };

  const reportScore = async (game, scoreDelta) => {
    const data = await apiFetch("/api/scores", {
      method: "POST",
      body: JSON.stringify({ game, scoreDelta }),
    });

    setUser(data.user);
    return data;
  };

  const fetchLeaderboard = async () => {
    const data = await apiFetch("/api/leaderboard");
    return data.users;
  };

  const fetchUserScores = async (userId) => {
    const data = await apiFetch("/api/leaderboard");
    const profile = data.users.find((candidate) => candidate.id === userId);
    return scoresObjectToRows(profile?.scores);
  };

  const value = {
    user,
    authLoading,
    login,
    signup,
    logout,
    addFriend,
    removeFriend,
    fetchFriends,
    fetchUsers,
    fetchUserProfile,
    reportScore,
    fetchLeaderboard,
    fetchUserScores,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
