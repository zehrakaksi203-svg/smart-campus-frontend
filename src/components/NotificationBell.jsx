import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getUnreadCount,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../api/notifications";

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadUnreadCount = async () => {
    try {
      const response = await getUnreadCount();

      const count =
        response.data?.count ??
        response.count ??
        0;

      setUnreadCount(count);
    } catch (error) {
      console.error("Okunmamış bildirim sayısı alınamadı:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const response = await getMyNotifications({ page: 1, limit: 10 });

      const data = response.data?.notifications ?? [];

      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Bildirimler alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleOpen = async () => {
    const newState = !open;
    setOpen(newState);

    if (newState) {
      await loadNotifications();
    }
  };

  const handleRead = async (id) => {
    try {
      await markNotificationAsRead(id);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );

      await loadUnreadCount();
    } catch (error) {
      console.error("Bildirim okunamadı:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Bildirimler okundu olarak işaretlenemedi:",
        error
      );
    }
  };

  useEffect(() => {
    loadUnreadCount();
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        style={{
          position: "relative",
          border: "none",
          background: "transparent",
          fontSize: "22px",
          cursor: "pointer",
        }}
        title="Bildirimler"
      >
        🔔

        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "red",
              color: "white",
              borderRadius: "50%",
              minWidth: "18px",
              height: "18px",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2px",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "40px",
            width: "360px",
            maxHeight: "500px",
            overflowY: "auto",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "10px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.15)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: "15px",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong>Bildirimler</strong>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2563eb",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Tümünü okundu yap
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              Yükleniyor...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              Bildirim bulunmuyor.
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.isRead) {
                    handleRead(notification.id);
                  }
                }}
                style={{
                  padding: "14px",
                  borderBottom: "1px solid #eee",
                  cursor: notification.isRead
                    ? "default"
                    : "pointer",
                  background: notification.isRead
                    ? "white"
                    : "#eff6ff",
                }}
              >
                <div style={{ fontWeight: "bold" }}>
                  {notification.title}
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "13px",
                    color: "#555",
                  }}
                >
                  {notification.message}
                </div>

                {!notification.isRead && (
                  <div
                    style={{
                      marginTop: "7px",
                      fontSize: "11px",
                      color: "#2563eb",
                    }}
                  >
                    Okundu olarak işaretlemek için tıkla
                  </div>
                )}
              </div>
            ))
       
)}

<div
  style={{
    padding: "10px",
    textAlign: "center",
    borderTop: "1px solid #eee",
  }}
>
  <Link
    to="/notifications"
    onClick={() => setOpen(false)}
    style={{
      fontSize: "13px",
      color: "#2563eb",
      textDecoration: "none",
      fontWeight: "600",
    }}
  >
    Tümünü Gör
  </Link>
</div>
</div>
)}
</div>
);
}

export default NotificationBell;
