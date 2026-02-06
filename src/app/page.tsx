'use client'
// 1. Импортируем готовый 'db' и 'auth' из твоего файла firebase.ts
import { db } from '../firebase'; 
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';

// Твои настройки цветов из Android (TxPurple)
const TxPurple = '#6200EE';
const TxBgDark = '#121212';

export default function Home() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Берем ID твоего пользователя из базы
  const userId = "gQaG7Ni5fyUbVlc65RzyWXwyduG2";

  useEffect(() => {
    // Слушаем базу в реальном времени (как LiveData в Kotlin)
    const unsub = onSnapshot(doc(db, "users", userId), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      } else {
        toast.error("Пользователь не найден");
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <main style={{ backgroundColor: TxBgDark, minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      <Toaster />
      
      {/* HEADER */}
      <div style={{ padding: '20px', borderBottom: `1px solid ${TxPurple}33`, textAlign: 'center' }}>
        <h1 style={{ color: TxPurple, margin: 0 }}>TemplateX Web</h1>
      </div>

      {/* CONTENT CARDS */}
      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={cardStyle}>
          {loading ? (
            <p>Загрузка данных из Firebase...</p>
          ) : (
            <>
              <h2 style={{ color: TxPurple }}>Профиль из Android Studio</h2>
              <div style={{ textAlign: 'left', marginTop: '20px' }}>
                <p>👤 Имя: <b>{userData?.display_name || 'боззи'}</b></p>
                <p>📧 Почта: <b>{userData?.email}</b></p>
                <p>⭐ Рейтинг: <b style={{ color: '#FFD700' }}>{userData?.rating || 0}</b></p>
              </div>
            </>
          )}
        </div>

        {/* Сюда будем вставлять твою логику на 1800 строк */}
        <p style={{ marginTop: '20px', color: '#666', fontSize: '12px' }}>
          Логика Kotlin готова к переносу...
        </p>
      </div>
    </main>
  );
}

const cardStyle: any = {
  background: '#1E1E1E',
  padding: '30px',
  borderRadius: '24px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
  border: '1px solid #333',
  width: '100%',
  maxWidth: '400px',
  textAlign: 'center'
};