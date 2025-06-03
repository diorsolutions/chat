import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import styles from "./ChatPage.module.css";
import ChatUsersInfo from "./ChatUsersInfo"; // ✅ yangi komponentni import qilamiz

const socket = io("http://localhost:5000");

function ChatPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]); // ✅ online users state

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (typingUsers.length > 0) {
      scrollToBottom();
    }
  }, [typingUsers]);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    socket.emit("set-username", user);

    socket.on("last-20-messages", (lastMessages) => {
      setMessages(lastMessages);
    });

    const handleUserJoined = (data) => {
      const isSelf = data.username === user.firstName + " " + user.lastName;
      const messageText = isSelf
        ? `Siz chatga qo'shildingiz`
        : `${data.username} chatga qo'shildi`;

      setMessages((prevMessages) => {
        const alreadyExists = prevMessages.some(
          (msg) => msg.type === "system" && msg.text === messageText
        );
        if (!alreadyExists) {
          return [...prevMessages, { text: messageText, type: "system" }];
        }
        return prevMessages;
      });
    };

    socket.on("user-joined", handleUserJoined);

    socket.on("message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on("user-left", (data) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: `${data.username} chatdan chiqdi`, type: "system" },
      ]);
    });

    socket.on("typing", (data) => {
      setTypingUsers((prev) => {
        if (
          !prev.includes(data.username) &&
          data.username !== user.firstName + " " + user.lastName
        ) {
          return [...prev, data.username];
        }
        return prev;
      });
    });

    socket.on("stop-typing", (data) => {
      setTypingUsers((prev) => prev.filter((u) => u !== data.username));
    });

    // ✅ online user listni yangilash
    socket.on("update-users", (userList) => {
      setOnlineUsers(userList);
    });

    return () => {
      socket.off("last-20-messages");
      socket.off("user-joined", handleUserJoined);
      socket.off("message");
      socket.off("user-left");
      socket.off("typing");
      socket.off("stop-typing");
      socket.off("update-users");
    };
  }, [navigate, user]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && user) {
      socket.emit("new-message", newMessage.trim());
      setNewMessage("");
      socket.emit("stop-typing");
    } else if (!user) {
      console.error("Foydalanuvchi ma'lumotlari topilmadi!");
      navigate("/");
    }
  };

  return (
    <div className={styles.chatWrapper}>
      {/* Chat asosiy qismi */}
      <div className={styles.chatMain}>
        <div className={styles.messageList}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`${styles.message} ${
                msg.type === "system"
                  ? styles.system
                  : msg.username === user.firstName + " " + user.lastName
                  ? styles.sent
                  : styles.received
              } ${
                msg.username === user.firstName + " " + user.lastName
                  ? styles.myMessage
                  : ""
              }`}
            >
              {msg.type !== "system" && (
                <div
                  className={styles.avatar}
                  data-username={
                    msg.username ? msg.username.charAt(0).toLowerCase() : ""
                  }
                >
                  {msg.username ? msg.username.charAt(0).toUpperCase() : "?"}
                </div>
              )}
              <div className={styles.messageContent}>
                <span className={styles.username}>{msg.username}</span>
                <span className={styles.text}>{msg.text}</span>
                {msg.timestamp && (
                  <span
                    className={`${styles.timestamp} ${styles.messageTime} ${
                      msg.username === user.firstName + " " + user.lastName
                        ? styles.myTimestamp
                        : ""
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          ))}

          {typingUsers.length > 0 && (
            <div className={styles.typingIndicator}>
              <span className={styles.typingEmoji}>✍️</span>
              <p>{typingUsers.join(", ")}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className={styles.inputContainer}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (e.target.value.trim() !== "") {
                socket.emit("typing");
              } else {
                socket.emit("stop-typing");
              }
            }}
            onBlur={() => socket.emit("stop-typing")}
            placeholder="Xabar yozing..."
            className={styles.inputField}
          />
          <button type="submit" className={styles.sendButton}>
            Yuborish
          </button>
        </form>
      </div>

      {/* O‘ngdagi user info panel */}
      <div className={styles.chatSidebar}>
        <ChatUsersInfo users={onlineUsers} />
      </div>
    </div>
  );
}

export default ChatPage;
