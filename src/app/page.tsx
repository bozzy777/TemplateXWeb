'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from'../firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth';
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  query,
  Timestamp,
  getDoc,
} from 'firebase/firestore';


// ──────────────────────────────────────────────────────────────
// Глобальные настройки
const TxBlack = '#000000';
const TxWhite = '#FFFFFF';
const TxGray = '#757575';
const TxLightBg = '#FFFFFF';
const TxDarkBg = '#121212';
const TxSurfaceLight = '#F5F5F5';
const TxSurfaceDark = '#1E1E1E';

const ThemeManager = { isDark: false };
const LocaleManager = {
  lang: 'RU',
  t: (ru: string, en: string, kz: string) =>
    LocaleManager.lang === 'EN' ? en : LocaleManager.lang === 'KZ' ? kz : ru,
};

// Модели
interface Product {
  id: string;
  title: string;
  price: string;
  img: string;
  description: string;
  sellerId: string;
}

interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewedId: string;
  rating: number;
  comment: string;
  timestamp: any;
}

// Цензура
const censorText = (text: string): string => {
  const badWords = ['мат1', 'мат2', 'оскорбление1'];
  let censored = text;
  badWords.forEach((word) => {
    censored = censored.replace(new RegExp(word, 'gi'), '***');
  });
  return censored;
};

// ──────────────────────────────────────────────────────────────
// Простой компонент поля (замена TxField)
const TxField = ({
  value,
  onChangeText,
  placeholder,
  password = false,
  isError = false,
  errorMessage,
}: {
  value: string;
  onChangeText: (val: string) => void;
  placeholder: string;
  password?: boolean;
  isError?: boolean;
  errorMessage?: string;
}) => (
  <div style={{ margin: '12px 0' }}>
    <input
      type={password ? 'password' : 'text'}
      value={value}
      onChange={(e) => onChangeText(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '12px',
        border: `1px solid ${isError ? 'red' : '#ccc'}`,
        borderRadius: '12px',
        fontSize: '16px',
      }}
    />
    {isError && errorMessage && <p style={{ color: 'red', fontSize: '14px' }}>{errorMessage}</p>}
  </div>
);

// Простой пункт настроек
const SettingsItem = ({ icon, title, onClick }: { icon: string; title: string; onClick: () => void }) => (
  <div
    onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', padding: '12px 0', cursor: 'pointer' }}
  >
    <span style={{ marginRight: '16px', fontSize: '24px' }}>{icon}</span>
    <span style={{ fontSize: '16px' }}>{title}</span>
  </div>
);

// ──────────────────────────────────────────────────────────────
// Главный компонент
export default function Page() {
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState('RU');
  const [currentScreen, setCurrentScreen] = useState('main');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Сохранение темы/языка в localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedLang = localStorage.getItem('lang');
    if (savedTheme) setIsDark(JSON.parse(savedTheme));
    if (savedLang) setLang(savedLang);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', JSON.stringify(isDark));
    localStorage.setItem('lang', lang);
  }, [isDark, lang]);

  // Авторизация
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthChecking(false);
    });
    return unsub;
  }, []);

  if (isAuthChecking) return <div style={{ textAlign: 'center', marginTop: '100px' }}>Загрузка...</div>;

  // ──────────────────────────────────────────────────────────────
  // ЭКРАНЫ
  const AuthScreen = ({ onSuccess }: { onSuccess: (user: any) => void }) => {
    const [isReg, setIsReg] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    const handleAuth = () => {
      if (pass.length < 6) {
        alert('Пароль должен быть минимум 6 символов');
        return;
      }
      if (isReg && pass !== confirmPass) {
        alert('Пароли не совпадают');
        return;
      }
      setIsLoading(true);
      if (isReg) {
        createUserWithEmailAndPassword(auth, email.trim(), pass)
          .then((res) => {
            updateProfile(res.user, { displayName: name });
            const userData = {
              uid: res.user.uid,
              display_name: name,
              email: email.trim(),
              created_at: Timestamp.now(),
              rating: 0.0,
              reviewCount: 0,
            };
            setDoc(doc(db, 'users', res.user.uid), userData);
            sendEmailVerification(res.user);
            onSuccess(res.user);
          })
          .catch((e) => alert(e.message))
          .finally(() => setIsLoading(false));
      } else {
        signInWithEmailAndPassword(auth, email.trim(), pass)
          .then((res) => onSuccess(res.user))
          .catch((e) => alert(e.message))
          .finally(() => setIsLoading(false));
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24 }}>
        <img src="/logo_tx.png" alt="logo" style={{ width: 110, height: 110 }} />
        <h1 style={{ fontSize: 32 }}>TemplateX</h1>
        <h2 style={{ fontSize: 26 }}>{isReg ? 'Регистрация' : 'Авторизация'}</h2>
        {isReg && <TxField value={name} onChangeText={setName} placeholder="Имя" />}
        <TxField value={email} onChangeText={setEmail} placeholder="Email" />
        <TxField value={pass} onChangeText={setPass} placeholder="Пароль" password={true} />
        {isReg && <TxField value={confirmPass} onChangeText={setConfirmPass} placeholder="Повторите пароль" password={true} />}
        {!isReg && <button onClick={() => sendPasswordResetEmail(auth, email)}>Забыли пароль?</button>}
        {isLoading ? <div>Загрузка...</div> : <button onClick={handleAuth}>{isReg ? 'Регистрация' : 'Авторизация'}</button>}
        <button onClick={() => setIsReg(!isReg)}>{isReg ? 'Авторизация' : 'Регистрация'}</button>
      </div>
    );
  };

  const MainAppScreen = ({ onOpenSub }: { onOpenSub: (screen: string) => void }) => {
    const [tab, setTab] = useState(0);
    const menuItems = [
      { label: 'Маркет', icon: '🏠' },
      { label: 'Продать', icon: '➕' },
      { label: 'Чат', icon: '✉️' },
      { label: 'Профиль', icon: '👤' },
    ];

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 0' }}>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setTab(index)}
              style={{ fontWeight: tab === index ? 'bold' : 'normal' }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div>
          {tab === 0 && <MarketScreen />}
          {tab === 1 && <SellScreen />}
          {tab === 2 && <ChatScreen />}
          {tab === 3 && <ProfileScreen onOpenSub={onOpenSub} />}
        </div>
      </div>
    );
  };

  const MarketScreen = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
      const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
        setProducts(data);
      });
      return unsub;
    }, []);

    const filtered = products.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
      <div style={{ padding: 16 }}>
        <input
          placeholder={LocaleManager.t('Поиск...', 'Search...', 'Іздеу...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: 8, border: '1px solid', borderRadius: 12 }}
        />
        {filtered.length === 0 ? (
          <p>Нет товаров</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {filtered.map((item) => (
              <div key={item.id} style={{ border: '1px solid', borderRadius: 12, padding: 12 }}>
                <img src={item.img || 'https://via.placeholder.com/150'} alt={item.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                <p style={{ fontWeight: 'bold' }}>{item.title}</p>
                <p style={{ color: 'blue', fontSize: 18 }}>{item.price} ₸</p>
                <p>{item.description.slice(0, 60)}...</p>
                <button>Написать</button>
                <button>Связаться</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const SellScreen = () => {
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');

    const handleSell = () => {
      if (!title || !price || !description || !url) return alert('Заполните все поля');
      const productData = {
        title,
        price,
        description: censorText(description),
        img: url,
        sellerId: auth.currentUser?.uid,
      };
      addDoc(collection(db, 'products'), productData).then(() => alert('Товар добавлен')).catch((e) => alert(e.message));
    };

    return (
      <div style={{ padding: 20 }}>
        <h2>Выставить товар</h2>
        <TxField value={title} onChangeText={setTitle} placeholder="Название" />
        <TxField value={price} onChangeText={setPrice} placeholder="Цена (₸)" />
        <TxField value={description} onChangeText={setDescription} placeholder="Описание" />
        <TxField value={url} onChangeText={setUrl} placeholder="Фото URL" />
        <button onClick={handleSell}>Выставить</button>
      </div>
    );
  };

  const ChatScreen = () => (
    <div style={{ padding: 16 }}>
      <h2>Сообщения</h2>
      <p>Чат в разработке...</p>
    </div>
  );

  const ProfileScreen = ({ onOpenSub }: { onOpenSub: (screen: string) => void }) => {
    const user = auth.currentUser;
    const [photo, setPhoto] = useState('');
    const [regDate, setRegDate] = useState('-');
    const [rating, setRating] = useState(0.0);
    const [reviewCount, setReviewCount] = useState(0);

    useEffect(() => {
      if (!user?.uid) return;
      const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setPhoto(data.photoUrl || '');
          const ts = data.created_at.toDate();
          setRegDate(ts.toLocaleDateString());
          setRating(data.rating || 0.0);
          setReviewCount(data.reviewCount || 0);
        }
      });
      return unsub;
    }, [user?.uid]);

    const status = regDate.includes('2026') ? 'Новичок' : 'Местный';

    return (
      <div>
        <div style={{ height: 250, backgroundColor: '#000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <img src={photo || `https://ui-avatars.com/api/?name=${user?.displayName}&background=random`} alt="avatar" style={{ width: 100, height: 100, borderRadius: 50 }} />
          <h2>{user?.displayName}</h2>
          <p>{user?.email}</p>
          <button onClick={() => onOpenSub('settings')}>⚙️</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: 16 }}>
          <div><strong>{status}</strong><br/>Статус</div>
          <div><strong>{rating} ({reviewCount})</strong><br/>Рейтинг</div>
          <div><strong>{regDate}</strong><br/>В теме с</div>
        </div>
        <SettingsItem icon="🛒" title="Мои товары" onClick={() => onOpenSub('my_products')} />
        <SettingsItem icon="📋" title="История заказов" onClick={() => onOpenSub('orders')} />
        <SettingsItem icon="⭐" title="Отзывы" onClick={() => onOpenSub('reviews')} />
      </div>
    );
  };

  const SettingsHubScreen = ({ onBack, onNavigate, onLogout, setIsDark, setLang }: { onBack: () => void; onNavigate: (screen: string) => void; onLogout: () => void; setIsDark: (val: boolean) => void; setLang: (val: string) => void }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePass, setDeletePass] = useState('');

    const handleDelete = () => {
      const user = auth.currentUser;
      if (!user) return;
      const credential = EmailAuthProvider.credential(user.email ?? '', deletePass);
      reauthenticateWithCredential(user, credential)
        .then(() => deleteUser(user).then(onLogout))
        .catch((e) => alert(e.message));
    };

    return (
      <div style={{ padding: 16 }}>
        <h3>АККАУНТ</h3>
        <SettingsItem icon="✏️" title="Профиль" onClick={() => onNavigate('edit_profile')} />
        <SettingsItem icon="🔒" title="Безопасность" onClick={() => onNavigate('security')} />
        <SettingsItem icon="✉️" title="Почта" onClick={() => onNavigate('email')} />
        <h3>ПРИЛОЖЕНИЕ</h3>
        <SettingsItem icon="🎨" title="Внешний вид (Тема/Язык)" onClick={() => onNavigate('appearance')} />
        <h3>ИНФО</h3>
        <SettingsItem icon="ℹ️" title="Правила" onClick={() => onNavigate('legal')} />
        <SettingsItem icon="📞" title="Поддержка" onClick={() => onNavigate('support')} />
        <button onClick={onLogout} style={{ color: 'red' }}>Выйти</button>
        <button onClick={() => setShowDeleteConfirm(true)}>Удалить аккаунт</button>
        {showDeleteConfirm && (
          <div style={{ marginTop: 20, border: '1px solid red', padding: 16 }}>
            <p>Удалить аккаунт? Это нельзя отменить.</p>
            <TxField value={deletePass} onChangeText={setDeletePass} placeholder="Пароль" password={true} />
            <button onClick={handleDelete}>Удалить</button>
            <button onClick={() => setShowDeleteConfirm(false)}>Отмена</button>
          </div>
        )}
      </div>
    );
  };

  const EditProfileScreen = ({ onBack }: { onBack: () => void }) => {
    const user = auth.currentUser;
    const [name, setName] = useState(user?.displayName ?? '');
    const [photo, setPhoto] = useState('');

    useEffect(() => {
      if (!user?.uid) return;
      getDoc(doc(db, 'users', user.uid)).then((snap) => {
        if (snap.exists()) setPhoto(snap.data().photoUrl || '');
      });
    }, [user?.uid]);

    const handleSave = () => {
      if (!user) return;
      updateProfile(user, { displayName: name });
      updateDoc(doc(db, 'users', user.uid), { photoUrl: photo });
      alert('Сохранено');
      onBack();
    };

    return (
      <div style={{ padding: 20 }}>
        <h2>Редактировать профиль</h2>
        <TxField value={name} onChangeText={setName} placeholder="Имя" />
        <TxField value={photo} onChangeText={setPhoto} placeholder="URL Аватара" />
        <button onClick={handleSave}>Сохранить</button>
        <button onClick={onBack}>Назад</button>
      </div>
    );
  };

  const SecurityScreen = ({ onBack }: { onBack: () => void }) => {
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmNewPass, setConfirmNewPass] = useState('');

    const handleChangePassword = () => {
      if (newPass !== confirmNewPass || newPass.length < 6) return alert('Пароли не совпадают или короткие');
      const credential = EmailAuthProvider.credential(auth.currentUser?.email ?? '', oldPass);
      reauthenticateWithCredential(auth.currentUser!, credential).then(() => {
        updatePassword(auth.currentUser!, newPass).then(() => alert('Пароль изменен')).catch((e) => alert(e.message));
      }).catch((e) => alert('Неверный старый пароль'));
    };

    return (
      <div style={{ padding: 20 }}>
        <h2>Безопасность</h2>
        <TxField value={oldPass} onChangeText={setOldPass} placeholder="Старый пароль" password={true} />
        <TxField value={newPass} onChangeText={setNewPass} placeholder="Новый пароль" password={true} />
        <TxField value={confirmNewPass} onChangeText={setConfirmNewPass} placeholder="Повторите новый пароль" password={true} />
        <button onClick={handleChangePassword}>Изменить пароль</button>
        <button onClick={() => sendPasswordResetEmail(auth, auth.currentUser?.email ?? '')}>Сбросить пароль через Email</button>
        <button onClick={onBack}>Назад</button>
      </div>
    );
  };

  const EmailManagementScreen = ({ onBack }: { onBack: () => void }) => {
    const user = auth.currentUser;
    const [newEmail, setNewEmail] = useState('');

    const handleChangeEmail = () => {
      if (!user) return;
      updateEmail(user, newEmail).then(() => alert('Проверьте почту')).catch((e) => alert(e.message));
    };

    return (
      <div style={{ padding: 20 }}>
        <h2>Почта</h2>
        <p>Текущий: {user?.email}</p>
        {!user?.emailVerified && <button onClick={() => user && sendEmailVerification(user)} style={{ color: 'red' }}>Подтвердить Email</button>}
        <TxField value={newEmail} onChangeText={setNewEmail} placeholder="Новый Email" />
        <button onClick={handleChangeEmail}>Изменить</button>
        <button onClick={onBack}>Назад</button>
      </div>
    );
  };

  const AppearanceScreen = ({ onBack, setIsDark, setLang }: { onBack: () => void; setIsDark: (val: boolean) => void; setLang: (val: string) => void }) => (
    <div style={{ padding: 20 }}>
      <h2>Внешний вид</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Тёмная тема</span>
        <input type="checkbox" checked={isDark} onChange={(e) => setIsDark(e.target.checked)} />
      </div>
      {[['RU', 'Русский'], ['EN', 'English'], ['KZ', 'Қазақша']].map(([code, name]) => (
        <div key={code} onClick={() => setLang(code)} style={{ cursor: 'pointer', padding: '8px 0' }}>
          {name} {lang === code ? '✓' : ''}
        </div>
      ))}
      <button onClick={onBack}>Назад</button>
    </div>
  );

  const LegalScreen = ({ onBack }: { onBack: () => void }) => (
    <div style={{ padding: 20 }}>
      <h2>Документы</h2>
      <p>Правила Маркета</p>
      <p>1. Будьте честными.<br />2. Не нарушайте закон.</p>
      <button onClick={onBack}>Назад</button>
    </div>
  );

  const SupportScreen = ({ onBack }: { onBack: () => void }) => (
    <div style={{ padding: 20 }}>
      <h2>Поддержка</h2>
      <p>Свяжитесь с нами по email: support@templatex.com</p>
      <button onClick={onBack}>Назад</button>
    </div>
  );

  const MyProductsScreen = ({ onBack }: { onBack: () => void }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const user = auth.currentUser;

    useEffect(() => {
      if (!user?.uid) return;
      const q = query(collection(db, 'products'), where('sellerId', '==', user.uid));
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
        setProducts(data);
      });
      return unsub;
    }, [user?.uid]);

    const handleDelete = (id: string) => {
      deleteDoc(doc(db, 'products', id)).then(() => alert('Товар удален')).catch((e) => alert(e.message));
    };

    return (
      <div style={{ padding: 16 }}>
        <h2>Мои товары</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {products.map((item) => (
            <div key={item.id} style={{ border: '1px solid', borderRadius: 12, padding: 12 }}>
              <img src={item.img} alt={item.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
              <p>{item.title}</p>
              <p>{item.price} ₸</p>
              <p>{item.description.slice(0, 60)}...</p>
              <button onClick={() => alert('Редактирование в разработке')}>Редактировать</button>
              <button onClick={() => handleDelete(item.id)}>Удалить</button>
            </div>
          ))}
        </div>
        {products.length === 0 && <p>Нет товаров</p>}
        <button onClick={onBack}>Назад</button>
      </div>
    );
  };

  const OrdersScreen = ({ onBack }: { onBack: () => void }) => (
    <div style={{ padding: 20 }}>
      <h2>История заказов</h2>
      <p>В разработке</p>
      <button onClick={onBack}>Назад</button>
    </div>
  );

  const ReviewsScreen = ({ onBack }: { onBack: () => void }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const user = auth.currentUser;

    useEffect(() => {
      if (!user?.uid) return;
      const q = query(collection(db, 'reviews'), where('reviewedId', '==', user.uid));
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
        setReviews(data);
      });
      return unsub;
    }, [user?.uid]);

    return (
      <div style={{ padding: 16 }}>
        <h2>Отзывы</h2>
        {reviews.map((item) => (
          <div key={item.id} style={{ border: '1px solid', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <p>{item.reviewerName} {item.rating} ⭐</p>
            <p>{item.comment}</p>
            <p>{new Date(item.timestamp.toDate()).toLocaleDateString()}</p>
          </div>
        ))}
        {reviews.length === 0 && <p>Нет отзывов</p>}
        <button onClick={onBack}>Назад</button>
      </div>
    );
  };

  const EmailVerificationScreen = ({ onVerified, onLogout }: { onVerified: () => void; onLogout: () => void }) => {
    const user = auth.currentUser;
    const [statusText, setStatusText] = useState(`Ссылка отправлена на ${user?.email}`);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
      const interval = setInterval(() => {
        user?.reload().then(() => {
          if (user?.emailVerified) onVerified();
        });
      }, 3000);
      return () => clearInterval(interval);
    }, [user]);

    const checkVerified = () => {
      setIsChecking(true);
      user?.reload().then(() => {
        setIsChecking(false);
        if (user?.emailVerified) onVerified();
        else setStatusText('Email не подтверждён');
      });
    };

    return (
      <div style={{ textAlign: 'center', padding: 32 }}>
        <h2>Подтвердите email</h2>
        <p>{user?.email}</p>
        <p>{statusText}</p>
        {isChecking ? <p>Проверка...</p> : <button onClick={checkVerified}>Я подтвердил</button>}
        <button onClick={() => sendEmailVerification(user!)}>Отправить ещё раз</button>
        <button onClick={onLogout}>Выйти</button>
      </div>
    );
  };

  // ──────────────────────────────────────────────────────────────
  // Рендер текущего экрана
  const renderScreen = () => {
    if (!currentUser) return <AuthScreen onSuccess={setCurrentUser} />;
    if (!currentUser.emailVerified) return <EmailVerificationScreen onVerified={() => setCurrentUser(auth.currentUser)} onLogout={() => signOut(auth)} />;

    switch (currentScreen) {
      case 'main': return <MainAppScreen onOpenSub={setCurrentScreen} />;
      case 'settings': return <SettingsHubScreen onBack={() => setCurrentScreen('main')} onNavigate={setCurrentScreen} onLogout={() => signOut(auth)} setIsDark={setIsDark} setLang={setLang} />;
      case 'edit_profile': return <EditProfileScreen onBack={() => setCurrentScreen('settings')} />;
      case 'security': return <SecurityScreen onBack={() => setCurrentScreen('settings')} />;
      case 'email': return <EmailManagementScreen onBack={() => setCurrentScreen('settings')} />;
      case 'appearance': return <AppearanceScreen onBack={() => setCurrentScreen('settings')} setIsDark={setIsDark} setLang={setLang} />;
      case 'legal': return <LegalScreen onBack={() => setCurrentScreen('settings')} />;
      case 'support': return <SupportScreen onBack={() => setCurrentScreen('settings')} />;
      case 'my_products': return <MyProductsScreen onBack={() => setCurrentScreen('main')} />;
      case 'orders': return <OrdersScreen onBack={() => setCurrentScreen('main')} />;
      case 'reviews': return <ReviewsScreen onBack={() => setCurrentScreen('main')} />;
      default: return <MainAppScreen onOpenSub={setCurrentScreen} />;
    }
  };

  return (
    <div style={{ background: isDark ? TxDarkBg : TxLightBg, color: isDark ? TxWhite : TxBlack, minHeight: '100vh', padding: '20px' }}>
      {renderScreen()}
    </div>
  );
}