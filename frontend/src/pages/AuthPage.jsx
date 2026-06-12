import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const initialRegister = {
  name: "",
  email: "",
  hometown: "",
  password: ""
};

const initialLogin = {
  email: "",
  password: ""
};

export default function AuthPage() {
  const { login, logout, register, user } = useAuth();
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("register");

  async function handleRegister(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await register(registerForm);
      setMessage("Registration successful. You are now logged in.");
      setRegisterForm(initialRegister);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await login(loginForm);
      setMessage("Login successful.");
      setLoginForm(initialLogin);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="auth-marketing-page">
      {message ? <p className="message success">{message}</p> : null}
      {error ? <p className="message error">{error}</p> : null}

      {user ? (
        <section className="card auth-status">
          <div>
            <h3>Signed in as {user.name}</h3>
            <p>
              {user.email} - {user.hometown}
            </p>
          </div>
          <button className="primary-button" onClick={logout}>
            Logout
          </button>
        </section>
      ) : null}

      <section className="auth-hero-panel">
        <div className="auth-visual" />

        <div className="auth-form-shell">
          <div className="auth-form-card">
            <div className="auth-switcher">
              <button
                className={mode === "register" ? "auth-tab active" : "auth-tab"}
                onClick={() => setMode("register")}
                type="button"
              >
                Sign up
              </button>
              <button
                className={mode === "login" ? "auth-tab active" : "auth-tab"}
                onClick={() => setMode("login")}
                type="button"
              >
                Log in
              </button>
            </div>

            {mode === "register" ? (
              <form className="form-card auth-form-layout" onSubmit={handleRegister}>
                <h2>Discover your hometown network</h2>
                <button className="social-button" type="button">
                  Continue with community email
                </button>
                <button className="social-button" type="button">
                  Join with hometown invite
                </button>
                <div className="auth-divider">or</div>
                <input
                  className="input"
                  placeholder="Full name"
                  value={registerForm.name}
                  onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
                />
                <input
                  className="input"
                  placeholder="Email address"
                  type="email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
                />
                <input
                  className="input"
                  placeholder="Your hometown"
                  value={registerForm.hometown}
                  onChange={(event) => setRegisterForm({ ...registerForm, hometown: event.target.value })}
                />
                <input
                  className="input"
                  placeholder="Create a password"
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })}
                />
                <p className="auth-policy">
                  By continuing, you agree to keep Hometown Hub respectful, useful, and rooted in real
                  community participation.
                </p>
                <button className="primary-button auth-submit" type="submit">
                  Continue
                </button>
              </form>
            ) : (
              <form className="form-card auth-form-layout" onSubmit={handleLogin}>
                <h2>Welcome back to your people</h2>
                <button className="social-button" type="button">
                  Resume with community email
                </button>
                <button className="social-button" type="button">
                  Use your hometown invite
                </button>
                <div className="auth-divider">or</div>
                <input
                  className="input"
                  placeholder="Email address"
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                />
                <input
                  className="input"
                  placeholder="Password"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                />
                <button className="primary-button auth-submit" type="submit">
                  Log in
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
