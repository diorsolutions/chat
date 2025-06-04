import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import styles from "./LoginPage.module.css";

function LoginPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!firstName || !lastName) {
      setError("Iltimos, ism va familiyangizni kiriting!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_SOCKET_SeERVER}/verify-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ firstName, lastName }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const loggedInUser = {
          firstName,
          lastName,
          username: `${firstName} ${lastName}`,
        };
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        navigate("/chat");
      } else {
        setError(data.error || "Tasdiqlashda xatolik yuz berdi!");
      }
    } catch (error) {
      setError("Serverga ulanishda xatolik yuz berdi!");
      console.error("Xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h2>Kirish</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.userBox}>
            <input
              type="text"
              name="firstName"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <label>Ism</label>
          </div>
          <div className={styles.userBox}>
            <input
              type="text"
              name="lastName"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <label>Familiya</label>
          </div>
          {error && (
            <p style={{ color: "red", textAlign: "center", marginBottom: "15px" }}>
              {error}
            </p>
          )}
          <button type="submit" className={styles.loginButton} disabled={loading}>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            {loading ? "Yuklanmoqda..." : "Kirish"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
