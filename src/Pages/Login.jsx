import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../Components/Navbar";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login, signup, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please fill all fields");
      return;
    }
    setIsSubmitting(true);

    try {
      if (isSignup) {
        await signup(username, password);
      } else {
        await login(username, password);
      }

      navigate("/profile");
    } catch (requestError) {
      console.log(requestError);
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <Navbar />
      <div className="login-container">
        <div className="login-box">
          <h1>Arcade Hub</h1>
          <h3>{isSignup ? "Create Account" : "Login"}</h3>
          <br></br>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="error-message">{error}</p>}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : isSignup ? "Sign Up" : "Login"}
            </button>

            <button type="button" onClick={loginWithGoogle}>
              Continue with Google
            </button>
          </form>

          <p className="toggle-auth">
            {isSignup ? "Already have an account?" : "New here?"}{" "}
            <span onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? "Login" : "Create one"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
