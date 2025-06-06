import React, { useState, useEffect, useRef } from "react";

import styles from "./ChatPage.module.css";

const reactionEmojis = ["👍", "😂", "😀", "😢"];

export default function MessageItem({ message, currentUser, socket }) {
  const [showReactionBtn, setShowReactionBtn] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const reactionTimeoutRef = useRef(null);

  

  useEffect(() => {
    if (message.type !== "system") {
      reactionTimeoutRef.current = setTimeout(() => {
        setShowReactionBtn(true);
      }, 2000);
    }
    return () => clearTimeout(reactionTimeoutRef.current);
  }, [message]);

  const handleReactionClick = (emoji) => {
    if (!message._id) return;

    // Reaction allaqachon bormi va shu foydalanuvchidanmi?
    const userReaction = message.reactions?.find(
      (r) => r.emoji === emoji && r.username === currentUser
    );

    if (userReaction) {
      // Reactionni olib tashlash
      socket.emit("remove-reaction", {
        messageId: message._id,
        emoji,
        username: currentUser,
      });
    } else {
      // Reaction qo'shish
      socket.emit("add-reaction", {
        messageId: message._id,
        emoji,
        username: currentUser,
      });
    }

    setShowReactions(false);
  };

  return (
    <div
      className={`${styles.message} ${
        message.type === "system"
          ? styles.system
          : message.username === currentUser
            ? styles.sent
            : styles.received
      }`}
      onMouseLeave={() => setShowReactions(false)}
      style={{ position: "relative" }}
    >
      {message.type !== "system" && (
        <>
          <div className={styles.avatar}>
            {message.username?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.messageContent}>
            <span className={styles.username}>{message.username}</span>
            <span className={styles.text}>{message.text}</span>
            {message.timestamp && (
              <span className={styles.timestamp}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            )}

            {/* Reactions Display */}
            {message.reactions?.length > 0 && (
              <div
                className={`${styles.reactionsDisplay} ${
                  message.username === currentUser ? styles.right : styles.left
                }`}
              >
                {message.reactions.map((r, idx) => (
                  <span key={idx} className={styles.reactionEmoji}>
                    {r.emoji}
                  </span>
                ))}
              </div>
            )}
          </div>

          {showReactionBtn && (
            <div
              className={styles.reactionBtn}
              onMouseEnter={() => setShowReactions(true)}
            >
              😊
              {showReactions && (
                <div className={styles.reactionsContainer}>
                  {reactionEmojis.map((emoji) => (
                    <span
                      key={emoji}
                      className={styles.reactionEmoji}
                      onClick={() => handleReactionClick(emoji)}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {message.type === "system" && (
        <div className={styles.systemMessage}>{message.text}</div>
      )}
    </div>
  );
}
