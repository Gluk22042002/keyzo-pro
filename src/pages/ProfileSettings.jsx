import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

function AvatarDropZone({ value, onChange }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => { setPreview(value || ''); }, [value]);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
      onChange(data.url);
    } catch (err) { alert(err.message); }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
        dragOver ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 hover:border-primary-500/50'
      }`}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      {preview ? (
        <div className="relative group">
          <img src={preview} className="w-28 h-28 rounded-full object-cover mx-auto" onError={() => setPreview('')} />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
            <span className="text-white text-xs font-medium">{uploading ? '...' : 'Заменить'}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          {uploading ? (
            <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-2" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-white/[0.03] flex items-center justify-center mb-2">
              <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <p className="text-xs text-gray-400 text-center">
            {dragOver ? 'Отпустите файл' : 'Нажмите или перетащите фото'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ProfileSettings() {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [telegram, setTelegram] = useState('');
  const [discord, setDiscord] = useState('');
  const [website, setWebsite] = useState('');
  const [avatar, setAvatar] = useState('');
  const [lastUsernameChange, setLastUsernameChange] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFAUri, setTwoFAUri] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAMsg, setTwoFAMsg] = useState('');
  const [twoFAErr, setTwoFAErr] = useState('');

  const [notifPrefs, setNotifPrefs] = useState({ email_orders: true, email_promos: false, email_disputes: true });

  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, statsData] = await Promise.all([
        api.getUserSettings(),
        api.getUserStats(),
      ]);
      setProfile(settingsData);
      setUsername(settingsData.username || '');
      setBio(settingsData.bio || '');
      setTelegram(settingsData.telegram || '');
      setDiscord(settingsData.discord || '');
      setWebsite(settingsData.website || '');
      setAvatar(settingsData.avatar || '');
      setLastUsernameChange(settingsData.last_username_change);
      setTwoFAEnabled(settingsData.two_factor_enabled || false);
      if (settingsData.notification_prefs) {
        setNotifPrefs(settingsData.notification_prefs);
      }
      setStats(statsData);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const canChangeUsername = () => {
    if (!lastUsernameChange) return true;
    const last = new Date(lastUsernameChange);
    const now = new Date();
    const diffDays = (now - last) / (1000 * 60 * 60 * 24);
    return diffDays >= 30;
  };

  const getNextChangeDate = () => {
    if (!lastUsernameChange) return null;
    const last = new Date(lastUsernameChange);
    last.setDate(last.getDate() + 30);
    return last.toLocaleDateString('ru-RU');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      if (username !== profile.username && !canChangeUsername()) {
        alert('Можно менять раз в 30 дней');
        setSaving(false);
        return;
      }
      const updated = await api.updateProfile({ username, bio, telegram, discord, website, avatar });
      login(token, { ...user, username: updated.username, avatar: updated.avatar });
      setProfile(updated);
      setLastUsernameChange(updated.last_username_change || lastUsernameChange);
      alert('Профиль сохранён');
    } catch (err) { alert(err.message); }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    setPasswordMsg('');
    setPasswordErr('');
    if (!currentPassword || !newPassword) { setPasswordErr('Заполните все поля'); return; }
    if (newPassword.length < 6) { setPasswordErr('Минимум 6 символов'); return; }
    if (newPassword !== confirmPassword) { setPasswordErr('Пароли не совпадают'); return; }
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordMsg('Пароль изменён');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) { setPasswordErr(err.message); }
  };

  const handleSetup2FA = async () => {
    setTwoFAErr('');
    setTwoFAMsg('');
    try {
      const data = await api.setup2FA();
      setTwoFASecret(data.secret);
      setTwoFAUri(data.uri);
    } catch (err) { setTwoFAErr(err.message); }
  };

  const handleVerify2FA = async () => {
    setTwoFAErr('');
    setTwoFAMsg('');
    if (!twoFACode || twoFACode.length !== 6) { setTwoFAErr('Введите 6-значный код'); return; }
    try {
      await api.verify2FA(twoFACode);
      setTwoFAEnabled(true);
      setTwoFASecret('');
      setTwoFAUri('');
      setTwoFACode('');
      setTwoFAMsg('Двухфакторная аутентификация включена');
    } catch (err) { setTwoFAErr(err.message); }
  };

  const handleDisable2FA = async () => {
    setTwoFAErr('');
    setTwoFAMsg('');
    try {
      await api.disable2FA();
      setTwoFAEnabled(false);
      setTwoFAMsg('Двухфакторная аутентификация отключена');
    } catch (err) { setTwoFAErr(err.message); }
  };

  const handleSaveNotifications = async () => {
    try {
      await api.updateNotificationPrefs(notifPrefs);
      alert('Настройки уведомлений сохранены');
    } catch (err) { alert(err.message); }
  };

  const handleAvatarChange = async (url) => {
    setAvatar(url);
    try {
      const updated = await api.updateProfile({ avatar: url });
      login(token, { ...user, avatar: updated.avatar });
    } catch (err) { console.error(err); }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="space-y-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-40 glass-card rounded-2xl animate-shimmer" />
        ))}
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Профиль', icon: '👤' },
    { id: 'password', label: 'Пароль', icon: '🔑' },
    { id: 'security', label: 'Безопасность', icon: '🛡️' },
    { id: 'notifications', label: 'Уведомления', icon: '🔔' },
    { id: 'danger', label: 'Опасная зона', icon: '⚠️' },
  ];

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Настройки профиля</h1>
        <p className="text-sm text-gray-500 mt-0.5">Управление аккаунтом и настройками</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 glass rounded-xl overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-5 animate-fade-in">
          {/* Avatar */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Фото профиля</h3>
            <div className="flex flex-col items-center">
              <AvatarDropZone value={avatar} onChange={handleAvatarChange} />
              <p className="text-xs text-gray-600 mt-2">JPG, PNG, GIF. Макс. 5 МБ</p>
            </div>
          </div>

          {/* Username */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Имя пользователя</h3>
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={!canChangeUsername()}
                className="w-full h-12 px-4 glass-input rounded-xl text-white text-sm disabled:opacity-40"
                placeholder="Ваш логин"
              />
              <div className="flex items-center justify-between mt-2">
                {canChangeUsername() ? (
                  <p className="text-xs text-gray-600">Можно менять раз в 30 дней</p>
                ) : (
                  <p className="text-xs text-amber-400">
                    Следующее изменение: {getNextChangeDate()}
                  </p>
                )}
                {lastUsernameChange && (
                  <p className="text-xs text-gray-600">
                    Последнее изменение: {new Date(lastUsernameChange).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">О себе</h3>
            <div>
              <textarea
                value={bio}
                onChange={(e) => { if (e.target.value.length <= 500) setBio(e.target.value); }}
                rows={4}
                className="w-full px-4 py-3 glass-input rounded-xl text-white text-sm resize-none"
                placeholder="Расскажите о себе..."
              />
              <p className="text-xs text-gray-600 text-right mt-1">{bio.length}/500</p>
            </div>
          </div>

          {/* Social Links */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Социальные сети</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Telegram</label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm"
                  placeholder="@username"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Discord</label>
                <input
                  type="text"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm"
                  placeholder="username#0000"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Сайт</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Email</h3>
            <input
              type="email"
              value={user.email || profile?.email || ''}
              disabled
              className="w-full h-12 px-4 glass-input rounded-xl text-gray-500 text-sm opacity-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-600 mt-1">Email нельзя изменить</p>
          </div>

          {/* Account Stats */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Статистика аккаунта</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">На сайте с</p>
                <p className="text-sm text-white font-medium">
                  {stats?.member_since ? new Date(stats.member_since).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' }) : '—'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Заказов</p>
                <p className="text-sm text-white font-medium">{stats?.total_orders || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Потрачено</p>
                <p className="text-sm text-white font-medium">{Number(stats?.total_spent || 0).toLocaleString()} ₽</p>
              </div>
            </div>
          </div>

          <button onClick={handleSaveProfile} disabled={saving} className="w-full h-12 glass-button text-white font-semibold rounded-xl disabled:opacity-40 text-sm">
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="space-y-5 animate-fade-in">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Изменить пароль</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Текущий пароль</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm"
                  placeholder="Введите текущий пароль"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Новый пароль</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm"
                  placeholder="Минимум 6 символов"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Подтвердите пароль</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm"
                  placeholder="Повторите новый пароль"
                />
              </div>
            </div>
            {passwordErr && <p className="text-xs text-rose-400 mt-3">{passwordErr}</p>}
            {passwordMsg && <p className="text-xs text-emerald-400 mt-3">{passwordMsg}</p>}
            <button onClick={handleChangePassword} className="w-full h-12 glass-button text-white font-semibold rounded-xl text-sm mt-4">
              Изменить пароль
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-5 animate-fade-in">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Двухфакторная аутентификация (2FA)</h3>
            
            {twoFAEnabled ? (
              <div>
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-400 font-medium">2FA включена</p>
                    <p className="text-xs text-gray-500">Ваш аккаунт защищён</p>
                  </div>
                </div>
                <button onClick={handleDisable2FA} className="w-full h-11 glass-input rounded-xl text-rose-400 text-sm font-medium hover:bg-rose-500/10 transition">
                  Отключить 2FA
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500 mb-4">Двухфакторная аутентификация добавляет дополнительный уровень безопасности.</p>
                
                {twoFAUri ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-white/[0.03] flex flex-col items-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(twoFAUri)}`}
                        alt="QR Code"
                        className="w-44 h-44 rounded-xl bg-white p-2"
                      />
                      <p className="text-xs text-gray-500 mt-3">Отсканируйте QR-код в приложении Google Authenticator</p>
                      <p className="text-xs text-gray-400 font-mono mt-1 break-all">{twoFASecret}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">Введите код из приложения</label>
                      <input
                        type="text"
                        value={twoFACode}
                        onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm text-center tracking-[0.5em] font-mono"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                    {twoFAErr && <p className="text-xs text-rose-400">{twoFAErr}</p>}
                    {twoFAMsg && <p className="text-xs text-emerald-400">{twoFAMsg}</p>}
                    <button onClick={handleVerify2FA} className="w-full h-11 glass-button text-white font-semibold rounded-xl text-sm">
                      Подтвердить и включить
                    </button>
                  </div>
                ) : (
                  <div>
                    {twoFAErr && <p className="text-xs text-rose-400 mb-3">{twoFAErr}</p>}
                    {twoFAMsg && <p className="text-xs text-emerald-400 mb-3">{twoFAMsg}</p>}
                    <button onClick={handleSetup2FA} className="w-full h-11 glass-button text-white font-semibold rounded-xl text-sm">
                      Включить 2FA
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-5 animate-fade-in">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Email-уведомления</h3>
            <div className="space-y-4">
              {[
                { key: 'email_orders', label: 'Заказы', desc: 'Уведомления о новых заказах и статусе' },
                { key: 'email_promos', label: 'Акции и новости', desc: 'Скидки, промокоды и обновления' },
                { key: 'email_disputes', label: 'Споры', desc: 'Уведомления о спорах и возвратах' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition">
                  <div>
                    <p className="text-sm text-white font-medium">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifPrefs({ ...notifPrefs, [item.key]: !notifPrefs[item.key] })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${notifPrefs[item.key] ? 'bg-primary-500' : 'bg-white/10'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifPrefs[item.key] ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={handleSaveNotifications} className="w-full h-11 glass-button text-white font-semibold rounded-xl text-sm mt-4">
              Сохранить настройки
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      {activeTab === 'danger' && (
        <div className="space-y-5 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 border border-rose-500/20">
            <h3 className="text-sm font-semibold text-rose-400 mb-2">Удалить аккаунт</h3>
            <p className="text-xs text-gray-500 mb-4">
              Это действие необратимо. Все ваши данные, товары, заказы и сообщения будут удалены навсегда.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  Введите <span className="text-rose-400 font-medium">УДАЛИТЬ</span> для подтверждения
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="w-full h-11 px-4 glass-input rounded-xl text-white text-sm"
                  placeholder="УДАЛИТЬ"
                />
              </div>
              <button
                disabled={deleteConfirm !== 'УДАЛИТЬ'}
                className="w-full h-11 bg-rose-500/20 text-rose-400 font-semibold rounded-xl text-sm transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-rose-500/30"
              >
                Удалить аккаунт навсегда
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
