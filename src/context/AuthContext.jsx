/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  async function ensureUserProfile(user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!data) {
      await supabase.from("users").insert({
        id: user.id,
        username: user.email.split("@")[0], // temp username
        xp: 0,
      });
    }
  }

  useEffect(() => {
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        setUser(null);
      } else {
        await ensureUserProfile(data.user);
        setUser(data.user);
      }

      setAuthLoading(false);
    };

    loadSession();
  }, []);

  //USER LOGIN
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    await ensureUserProfile(data.user);

    setUser(data.user);
    return data.user;
  };

  const signup = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    await ensureUserProfile(data.user);

    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) return new Error(error.message);
  };

  //FRIENDS

  const fetchUsers = async (search = "") => {
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    if (!currentUser) throw new Error("Not authenticated");

    // 1. get all users
    const { data: allUsers, error: usersError } = await supabase
      .from("users")
      .select("id, username, xp");

    if (usersError) throw new Error(usersError.message);

    // 2. get friend relationships
    const { data: relations, error: relError } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", currentUser.id);

    if (relError) throw new Error(relError.message);

    const friendIds = relations.map((r) => r.friend_id);

    // 3. attach isFriend + filter
    return allUsers
      .filter((u) => u.id !== currentUser.id)
      .filter((u) => u.username.toLowerCase().includes(search.toLowerCase()))
      .map((u) => ({
        ...u,
        isFriend: friendIds.includes(u.id),
      }));
  };

  const fetchUserProfile = async (username) => {
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData.user;

    if (!currentUser) throw new Error("Not authenticated");

    // 1. get requested user
    const { data: requestedUser, error: userError } = await supabase
      .from("users")
      .select("id, username, xp")
      .eq("username", username)
      .maybeSingle();

    if (userError) throw new Error(userError.message);
    if (!requestedUser) throw new Error("User not found");

    // 2. check friendship
    const { data: relation } = await supabase
      .from("friends")
      .select("*")
      .eq("user_id", currentUser.id)
      .eq("friend_id", requestedUser.id)
      .maybeSingle();

    if (!relation && currentUser.id !== requestedUser.id) {
      throw new Error("You can only view your friends' profiles");
    }

    return requestedUser;
  };

  const addFriend = async (friendUsername) => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) throw new Error("Not authenticated");

    const { data: friendUser } = await supabase
      .from("users")
      .select("id, username")
      .eq("username", friendUsername)
      .single();

    if (!friendUser) throw new Error("User not found");

    await supabase
      .from("friends")
      .insert([{ user_id: user.id, friend_id: friendUser.id }]);
  };

  const removeFriend = async (friendUsername) => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    const { data: friendUser } = await supabase
      .from("users")
      .select("id")
      .eq("username", friendUsername)
      .maybeSingle();

    await supabase
      .from("friends")
      .delete()
      .eq("user_id", user.id)
      .eq("friend_id", friendUser.id);
  };

  const fetchFriends = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    const { data: relations } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", user.id);

    const friendIds = relations.map((r) => r.friend_id);

    const { data: friends } = await supabase
      .from("users")
      .select("id, username, xp")
      .in("id", friendIds);

    return friends;
  };

  //SCORE AND LEADERBOARD
  const reportScore = async (game, scoreDelta) => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) throw new Error("Not authenticated.");

    const { data: existing } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .eq("game", game)
      .single();

    let newScore = scoreDelta;

    console.log(existing);
    if (existing) {
      newScore = existing.score + scoreDelta;

      await supabase
        .from("scores")
        .update({ score: newScore })
        .eq("id", existing.id);
    } else {
      await supabase.from("scores").insert({
        user_id: user.id,
        game,
        score: scoreDelta,
      });
    }

    const xpGain = Math.max(1, Math.ceil(scoreDelta * 0.2));

    const { data: profile } = await supabase
      .from("users")
      .select("xp")
      .eq("id", user.id)
      .single();

    const newXp = (profile?.xp || 0) + xpGain;

    await supabase.from("users").update({ xp: newXp }).eq("id", user.id);
  };

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("xp", { ascending: false });

    if (error) throw new Error(error.message);

    return data;
  };

  const fetchUserScores = async (userId) => {
    const { data, error } = await supabase
      .from("scores")
      .select("game, score")
      .eq("user_id", userId);

    if (error) throw new Error(error.message);

    return data;
  };

  const value = {
    user,
    authLoading,
    login,
    signup,
    logout,
    loginWithGoogle,
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
