import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { TrashIcon, UserCircleIcon, PlusCircleIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import { usersAPI } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';

interface UsersProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const Users: React.FC<UsersProps> = ({ users, setUsers }) => {
  const { theme } = useTheme();
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' as UserRole });
  const [error, setError] = useState('');
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newUser.username.trim() || !newUser.password.trim()) {
      setError('اسم المستخدم وكلمة المرور مطلوبان.');
      return;
    }
    if (users.some(user => user.username.toLowerCase() === newUser.username.toLowerCase())) {
      setError('اسم المستخدم هذا موجود بالفعل.');
      return;
    }

    const userToAdd: User = {
      id: crypto.randomUUID(),
      username: newUser.username.trim(),
      password: newUser.password.trim(),
      role: newUser.role,
    };

    try {
      const createdUser = await usersAPI.create(userToAdd);
      setUsers(prev => [...prev, createdUser]);
      setNewUser({ username: '', password: '', role: 'user' });
    } catch (error) {
      alert('حدث خطأ أثناء إضافة المستخدم. يرجى المحاولة مرة أخرى.');
      console.error('Error creating user:', error);
    }
  };

  const handleDeleteUser = (user: User) => {
    if (user.username === 'admin') {
        alert('لا يمكن حذف حساب المسؤول الافتراضي.');
        return;
    }

    setConfirmModalState({
        isOpen: true,
        title: 'تأكيد الحذف',
        message: `هل أنت متأكد من حذف المستخدم "${user.username}"؟`,
        onConfirm: async () => {
            try {
                await usersAPI.delete(user.id);
                setUsers(prev => prev.filter(u => u.id !== user.id));
            } catch (error) {
                alert('حدث خطأ أثناء حذف المستخدم. يرجى المحاولة مرة أخرى.');
                console.error('Error deleting user:', error);
            }
        }
    });
  };

  const getRoleBadge = (role: UserRole) => {
    if (role === 'admin') {
      return <span className="text-xs font-bold bg-red-500/30 text-red-300 py-1 px-2 rounded-full">مسؤول</span>;
    } else if (role === 'scanner') {
      return <span className="text-xs font-bold bg-green-500/30 text-green-300 py-1 px-2 rounded-full">قارئ باركود</span>;
    } else {
      return <span className="text-xs font-bold bg-sky-500/30 text-sky-300 py-1 px-2 rounded-full">مستخدم</span>;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fadeIn">
      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-8">إدارة المستخدمين</h1>

      <div className={`p-6 rounded-2xl border mb-8 ${theme === 'dark' ? 'glass border-slate-700/50' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>إضافة مستخدم جديد</h2>
        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>اسم المستخدم</label>
            <input
              type="text"
              name="username"
              value={newUser.username}
              onChange={handleInputChange}
              className={`w-full p-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-800'
              }`}
            />
          </div>
          <div className="md:col-span-1">
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>كلمة المرور</label>
            <input
              type="password"
              name="password"
              value={newUser.password}
              onChange={handleInputChange}
              className={`w-full p-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-800'
              }`}
            />
          </div>
          <div className="md:col-span-1">
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>الدور</label>
            <select
              name="role"
              value={newUser.role}
              onChange={handleInputChange}
              className={`w-full p-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-800'
              }`}
            >
              <option value="user">مستخدم</option>
              <option value="admin">مسؤول</option>
              <option value="scanner">قارئ باركود</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <button
              type="submit"
              className="w-full h-10 flex items-center justify-center gap-2 gradient-purple hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>إضافة</span>
            </button>
          </div>
        </form>
        {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
      </div>

      <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'glass' : 'bg-white border border-gray-200'}`}>
        <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>قائمة المستخدمين ({users.length})</h2>
        <div className="space-y-3">
          {users.map(user => (
            <div key={user.id} className={`p-3 rounded-xl flex justify-between items-center transition-all duration-300 hover:scale-[1.02] ${
              theme === 'dark'
                ? 'bg-slate-800/60 hover:bg-slate-800/80'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}>
                <div className="flex items-center gap-4">
                    <UserCircleIcon className={`w-8 h-8 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}/>
                    <div>
                        <p className={`font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-800'}`}>{user.username}</p>
                        {getRoleBadge(user.role)}
                    </div>
                </div>
              <button
                onClick={() => handleDeleteUser(user)}
                disabled={user.username === 'admin'}
                className="p-2 bg-red-800 hover:bg-red-700 text-white rounded-md transition-colors disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                title="حذف المستخدم"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <ConfirmationModal 
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalState.onConfirm}
        title={confirmModalState.title}
        message={confirmModalState.message}
      />
    </div>
  );
};

export default Users;