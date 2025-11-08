import React, { useState } from 'react';
import { User, AuthenticatedUser } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface LoginProps {
  users: User[];
  onLoginSuccess: (user: AuthenticatedUser) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLoginSuccess }) => {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const foundUser = users.find(
        (user) => user.username === username && user.password === password
      );

      if (foundUser) {
        onLoginSuccess({ username: foundUser.username, role: foundUser.role });
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
        setPassword('');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-slate-950 pattern-islamic' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      <div className={`w-full max-w-sm p-8 space-y-8 rounded-2xl shadow-2xl animate-fadeIn ${
        theme === 'dark' 
          ? 'glass border border-slate-700/50 shadow-black/40' 
          : 'bg-white border border-gray-200 shadow-gray-300/50'
      }`}>
        <div>
           <div className="flex justify-center mb-6">
             <img 
               src="/logo.jpg" 
               alt="معازيم" 
               className="h-24 w-auto object-contain"
             />
           </div>
          <h2 className={`mt-6 text-center text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>
            تسجيل الدخول إلى حسابك
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username-input" className="sr-only">
                اسم المستخدم
              </label>
              <input
                id="username-input"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`relative block w-full appearance-none rounded-lg border-2 px-4 py-3 focus:z-10 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 sm:text-sm text-center transition-all ${
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-400'
                    : 'border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400'
                }`}
                placeholder="اسم المستخدم"
              />
            </div>
            <div>
              <label htmlFor="password-input" className="sr-only">
                كلمة المرور
              </label>
              <input
                id="password-input"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`relative block w-full appearance-none rounded-lg border-2 px-4 py-3 focus:z-10 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 sm:text-sm text-center transition-all ${
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-400'
                    : 'border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400'
                }`}
                placeholder="كلمة المرور"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-center bg-red-500/20 border border-red-500/50 rounded-md">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative flex w-full justify-center rounded-lg border border-transparent gradient-teal py-3 px-4 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                theme === 'dark' ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white'
              }`}
            >
              {isLoading ? 'جارِ التحقق...' : 'تسجيل الدخول'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;