import React from "react";
import styles from "./ChatUsersInfo.module.css";
import image from "../assets/image.jpg";

function ChatUsersInfo({ users }) {
  return (
    <div className={styles.container}>
      <div className={styles.box_info}>
        <div className={styles.box_info_title}>
          <h2 className={styles.title}>Guruh Ma'lumotlari</h2>
          <p className={styles.description}>
            Ushbu chatda real vaqtli xabar almashinuvi amalga oshiriladi.
          </p>
        </div>
        <div className={styles.image_info_group}>
          <img src={image} alt="logo" />
        </div>
      </div>

      <div className={styles.box_info_users}>
        <h3 className={styles.subtitle}>Online foydalanuvchilar:</h3>
        <ul className={styles.userList}>
          {users.map((user, index) => (
            <li key={index} className={styles.user}>
              <span className={styles.statusDot} title="Online">
                🟢
              </span>
              {user}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ChatUsersInfo;
