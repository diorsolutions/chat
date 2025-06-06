import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import styles from "./ChatPage.module.css";
import ChatUsersInfo from "./ChatUsersInfo";
import MessageItem from "./MessageItem";
import { Picker } from "emoji-mart";
// import "emoji-mart/css/emoji-mart.css";

const socket = io("http://localhost:5000");

function ChatPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const isFirstJoin = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    socket.emit("set-username", {
      ...user,
      joined: isFirstJoin.current,
    });
    isFirstJoin.current = false;

    socket.on("last-20-messages", setMessages);

    socket.on("user-joined", (data) => {
      const isSelf = data.username === `${user.firstName} ${user.lastName}`;
      const messageText = isSelf
        ? `Siz chatga qo'shildingiz`
        : `${data.username} chatga qo'shildi`;

      setMessages((prev) => {
        const exists = prev.some(
          (msg) => msg.type === "system" && msg.text === messageText
        );
        return exists ? prev : [...prev, { text: messageText, type: "system" }];
      });
    });

    socket.on("message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("user-left", (data) => {
      setMessages((prev) => [...prev, { text: data.message, type: "system" }]);
    });

    socket.on("typing", (data) => {
      const fullName = `${user.firstName} ${user.lastName}`;
      if (data.username !== fullName && !typingUsers.includes(data.username)) {
        setTypingUsers((prev) => [...prev, data.username]);
      }
    });

    socket.on("stop-typing", (data) => {
      setTypingUsers((prev) => prev.filter((u) => u !== data.username));
    });

    socket.on("update-users", setOnlineUsers);

    socket.on("reaction-updated", (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    return () => {
      socket.off("last-20-messages");
      socket.off("user-joined");
      socket.off("message");
      socket.off("user-left");
      socket.off("typing");
      socket.off("stop-typing");
      socket.off("update-users");
      socket.off("reaction-updated");
    };
  }, [navigate, user, typingUsers]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket.emit("new-message", newMessage.trim());
      setNewMessage("");
      socket.emit("stop-typing");
      setShowEmojiPicker(false); // Emoji pickerni yuborishdan keyin yopish
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji.native);
  };

  return (
    <div className={styles.chatWrapper}>
      <div className={styles.chatMain}>
        <div className={styles.messageList}>
          {messages.map((msg) => (
            <MessageItem
              key={msg._id || msg.timestamp || msg.text}
              message={msg}
              currentUser={`${user.firstName} ${user.lastName}`}
              socket={socket}
            />
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
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={styles.emojiToggle}
          >
            😊
          </button>

          {showEmojiPicker && (
            <div className={styles.emojiPicker}>
              <Picker onSelect={handleEmojiSelect} />
            </div>
          )}

          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              socket.emit(e.target.value ? "typing" : "stop-typing");
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

      <div className={styles.chatSidebar}>
        <ChatUsersInfo users={onlineUsers} />
      </div>
    </div>
  );
}

export default ChatPage;
