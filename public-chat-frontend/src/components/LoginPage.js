import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import styles from "./LoginPage.module.css"; // CSS faylini import qilish

function LoginPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Loading state qo'shildi

  const handleSubmit = async (e) => {
    e.preventDefault(); // Formaning standart submit xatti-harakatini to'xtatish
    setError(""); // Oldingi xatolarni tozalash

    if (!firstName || !lastName) {
      setError("Iltimos, ism va familiyangizni kiriting!");
      return;
    }

    setLoading(true); // Yuklanishni boshlash

    try {
      const response = await fetch("http://localhost:5000/verify-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstName, lastName }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Tasdiqlash muvaffaqiyatli:", data);
        const loggedInUser = {
          firstName,
          lastName,
          username: `${firstName} ${lastName}`,
        };
        localStorage.setItem("user", JSON.stringify(loggedInUser)); // Foydalanuvchi ma'lumotlarini localStorage ga saqlash
        navigate("/chat"); // Chat sahifasiga yo'naltirish
      } else {
        setError(data.error || "Tasdiqlashda xatolik yuz berdi!");
      }
    } catch (error) {
      setError("Serverga ulanishda xatolik yuz berdi!");
      console.error("Xatolik:", error);
    } finally {
      setLoading(false); // Yuklanishni yakunlash
    }
  };

  return (
    <div className={styles.loginContainer}> {/* Asosiy konteyner klassi */}
      <div className={styles.loginBox}> {/* Login qutisi klassi */}
        <h2>Kirish</h2> {/* Sarlavha */}
        <form onSubmit={handleSubmit}> {/* Formani onSubmit bilan bog'ladik */}
          <div className={styles.userBox}> {/* Input va label uchun konteyner */}
            <input
              type="text"
              name="firstName"
              required // Majburiy maydon
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <label>Ism</label> {/* Input ustidagi label */}
          </div>
          <div className={styles.userBox}> {/* Input va label uchun konteyner */}
            <input
              type="text"
              name="lastName"
              required // Majburiy maydon
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <label>Familiya</label> {/* Input ustidagi label */}
          </div>
          {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>} {/* Xatolik xabari */}
          <button type="submit" className={styles.loginButton} disabled={loading}> {/* Tugma klassi va loading holati */}
            {/* Animatsiya uchun span elementlari */}
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            {loading ? "Yuklanmoqda..." : "Kirish"} {/* Yuklanish matni */}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;