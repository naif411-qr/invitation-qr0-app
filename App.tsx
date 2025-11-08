import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import Reporting from './components/Reporting';
import Designs from './components/Designs';
import Users from './components/Users';
import QuickInvite from './components/QuickInvite';
import Login from './components/Login';
import { UsersIcon, ScanIcon, ChartBarIcon, BrushIcon, LogoutIcon, UserCircleIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, MenuIcon } from './components/Icons';
import { AuthenticatedUser, User, Group, Member, ScanLog, DesignTemplate } from './types';
import { usersAPI, groupsAPI, membersAPI, scanLogsAPI, designsAPI, messagesAPI, initDB } from './lib/api';
import { useTheme } from './contexts/ThemeContext';

type View = 'dashboard' | 'scanner' | 'reporting' | 'designs' | 'users' | 'quickInvite';

const APP_CURRENT_USER_KEY = 'current-user';

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  // State management using API
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [designs, setDesigns] = useState<DesignTemplate[]>([]);
  
  const DEFAULT_THANK_YOU_MSG = 'مرحباً {memberName}، شكراً لحضورك فعالية "{eventName}". نتمنى أن تكون قد استمتعت!';
  const DEFAULT_FOLLOW_UP_MSG = 'مرحباً {memberName}، لقد افتقدناك في فعاليتنا "{eventName}". نأمل أن نراك في المرة القادمة!';
  const DEFAULT_RSVP_MSG = 'مرحباً {memberName}، أنت مدعو لحضور "{eventName}". يرجى تأكيد حضورك بالرد على هذه الرسالة بـ "أؤكد" أو "أعتذر".';
  const [thankYouMessage, setThankYouMessage] = useState<string>(DEFAULT_THANK_YOU_MSG);
  const [followUpMessage, setFollowUpMessage] = useState<string>(DEFAULT_FOLLOW_UP_MSG);
  const [rsvpMessage, setRsvpMessage] = useState<string>(DEFAULT_RSVP_MSG);
  const [messagesId, setMessagesId] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(() => {
    try {
      const storedUser = sessionStorage.getItem(APP_CURRENT_USER_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [librariesLoaded, setLibrariesLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Load external libraries
  useEffect(() => {
    if (window.QRCodeStyling && window.bwipjs) {
        setLibrariesLoaded(true);
        return;
    }

    const intervalId = setInterval(() => {
        if (window.QRCodeStyling && window.bwipjs) {
            setLibrariesLoaded(true);
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        }
    }, 100);

    const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        if (!librariesLoaded) {
             setLoadingError("فشل تحميل الموارد الأساسية. يرجى التحقق من اتصالك بالإنترنت وتحديث الصفحة.");
        }
    }, 10000);

    return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
    };
  }, [librariesLoaded]);

  // Initialize database and load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDB();
        
        const [usersData, groupsData, membersData, logsData, designsData, messagesData] = await Promise.all([
          usersAPI.getAll(),
          groupsAPI.getAll(),
          membersAPI.getAll(),
          scanLogsAPI.getAll(),
          designsAPI.getAll(),
          messagesAPI.get(),
        ]);

        setUsers(usersData);
        setGroups(groupsData);
        setMembers(membersData);
        setScanLogs(logsData);
        setDesigns(designsData);
        
        if (messagesData) {
          setThankYouMessage(messagesData.thankYouMessage);
          setFollowUpMessage(messagesData.followUpMessage);
          setRsvpMessage(messagesData.rsvpMessage || DEFAULT_RSVP_MSG);
          setMessagesId(messagesData.id);
        } else {
          const newMessages = await messagesAPI.create({
            thankYouMessage: DEFAULT_THANK_YOU_MSG,
            followUpMessage: DEFAULT_FOLLOW_UP_MSG,
            rsvpMessage: DEFAULT_RSVP_MSG,
          });
          setMessagesId(newMessages.id);
        }
        
        setDataLoading(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        setLoadingError('فشل تحميل البيانات من الخادم');
        setDataLoading(false);
      }
    };

    if (librariesLoaded) {
      loadData();
    }
  }, [librariesLoaded]);

  // Sync session storage for current user
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(APP_CURRENT_USER_KEY, JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(APP_CURRENT_USER_KEY);
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: AuthenticatedUser) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  if (loadingError) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-950 text-center p-4">
            <div>
                <h2 className="text-2xl font-bold text-red-400 mb-4">حدث خطأ</h2>
                <p className="text-slate-300">{loadingError}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                >
                  إعادة المحاولة
                </button>
            </div>
        </div>
    );
  }

  if (!librariesLoaded || dataLoading) {
      return (
          <div className="flex items-center justify-center h-screen bg-slate-950">
              <div className="text-center">
                  <svg className="animate-spin h-10 w-10 text-teal-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-lg text-slate-300">جارِ تحميل المكونات...</p>
              </div>
          </div>
      );
  }

  if (!currentUser) {
    return <Login users={users} onLoginSuccess={handleLoginSuccess} />;
  }

  const bgClass = theme === 'dark' 
    ? 'bg-slate-950 text-slate-300 pattern-islamic' 
    : 'bg-gray-50 text-gray-800';
  
  const navClass = theme === 'dark'
    ? 'bg-slate-900 border-slate-800'
    : 'bg-white border-gray-200';

  // If user is a scanner, only show scanner page
  if (currentUser.role === 'scanner') {
    return (
      <div className={`h-screen ${bgClass} overflow-hidden transition-all duration-300`}>
        <div className="flex flex-col h-full">
          <header className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <img 
                src="/logo.jpg" 
                alt="معازيم" 
                className="h-12 w-auto object-contain"
              />
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  مسح الباركود
                </h1>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{currentUser.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
                className={`p-2 transition-all duration-200 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleLogout}
                className={`p-2 transition-colors duration-200 rounded-lg group ${theme === 'dark' ? 'text-slate-500 hover:bg-red-900/50 hover:text-red-400' : 'text-gray-500 hover:bg-red-100 hover:text-red-600'}`}
                title="تسجيل الخروج"
              >
                <LogoutIcon className="w-5 h-5" />
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <Scanner 
              members={members} 
              setMembers={setMembers}
              scanLogs={scanLogs} 
              setScanLogs={setScanLogs}
              currentUser={currentUser}
            />
          </main>
        </div>
      </div>
    );
  }

  const renderView = () => {
    const dashboardProps = {
        groups, setGroups,
        members, setMembers,
        scanLogs,
        designs,
        currentUser,
        rsvpMessage
    };

    switch (currentView) {
      case 'dashboard':
        return <Dashboard {...dashboardProps} />;
      case 'quickInvite':
        return <QuickInvite 
          groups={groups}
          members={members}
          setMembers={setMembers}
          messagesTemplate={{ id: messagesId || '', thankYouMessage, followUpMessage, rsvpMessage }}
        />;
      case 'scanner':
        return <Scanner 
          members={members} setMembers={setMembers}
          scanLogs={scanLogs} setScanLogs={setScanLogs}
          currentUser={currentUser}
        />;
      case 'reporting':
        return <Reporting 
            members={members}
            setMembers={setMembers}
            groups={groups} 
            thankYouMessage={thankYouMessage}
            setThankYouMessage={setThankYouMessage}
            followUpMessage={followUpMessage}
            setFollowUpMessage={setFollowUpMessage}
            rsvpMessage={rsvpMessage}
            setRsvpMessage={setRsvpMessage}
            messagesId={messagesId}
        />;
      case 'designs':
        return <Designs designs={designs} setDesigns={setDesigns} />;
      case 'users':
        return currentUser.role === 'admin' ? <Users users={users} setUsers={setUsers} /> : <Dashboard {...dashboardProps} />;
      default:
        return <Dashboard {...dashboardProps} />;
    }
  };

  const NavButton: React.FC<{ view: View; label: string; icon: React.ReactNode; isCollapsed: boolean; onClick: () => void }> = ({ view, label, icon, isCollapsed, onClick }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        onClick();
      }}
      title={isCollapsed ? label : undefined}
      className={`relative flex items-center w-full p-3 transition-colors duration-200 rounded-lg group ${
        isCollapsed ? 'justify-center' : 'justify-start'
      } ${
        currentView === view
          ? 'bg-slate-800 text-teal-300'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
      }`}
    >
      {currentView === view && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-teal-400 rounded-r-full"></span>
      )}
      <div className="flex-shrink-0">{icon}</div>
      {!isCollapsed && (
        <span className="text-sm font-bold ms-4 whitespace-nowrap">{label}</span>
      )}
    </button>
  );

  return (
    <div className={`h-screen ${bgClass} overflow-hidden transition-all duration-300`}>
      <div className="flex flex-row-reverse h-full">
        {isMobileNavOpen && (
            <div 
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
            ></div>
        )}

        <nav className={`flex flex-col shadow-2xl z-30 border-l ${navClass} transition-all duration-300 ease-in-out 
            fixed lg:relative inset-y-0 right-0 transform ${isMobileNavOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0
            ${isNavCollapsed ? 'lg:w-24 w-64' : 'w-64'}`}>
            
            <div className={`flex items-center p-4 h-20 flex-shrink-0 border-b border-slate-800 ${isNavCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isNavCollapsed ? (
                    <img 
                        src="/logo.jpg" 
                        alt="معازيم" 
                        className="h-16 w-auto object-contain"
                    />
                ) : (
                    <img 
                        src="/logo.jpg" 
                        alt="معازيم" 
                        className="h-12 w-12 object-cover rounded-lg"
                    />
                )}
                <button 
                    onClick={() => setIsNavCollapsed(!isNavCollapsed)}
                    className="p-2 text-slate-500 hover:bg-slate-700 hover:text-slate-200 rounded-lg transition-colors hidden lg:block"
                    title={isNavCollapsed ? "توسيع الشريط الجانبي" : "طي الشريط الجانبي"}
                >
                {isNavCollapsed ? <ChevronDoubleLeftIcon className="w-6 h-6" /> : <ChevronDoubleRightIcon className="w-6 h-6" />}
                </button>
            </div>

            <div className="p-4 border-b border-slate-800 flex-shrink-0">
                <div className={`flex items-center gap-3 transition-all duration-300 ${isNavCollapsed ? 'justify-center' : ''}`}>
                    <UserCircleIcon className="w-10 h-10 text-slate-400 flex-shrink-0"/>
                    {!isNavCollapsed &&
                        <div className="overflow-hidden whitespace-nowrap">
                            <p className="font-bold text-sm text-slate-300 truncate">{currentUser.username}</p>
                            <p className="text-xs text-slate-500 capitalize">{currentUser.role}</p>
                        </div>
                    }
                </div>
            </div>

            <div className="flex-grow p-4 space-y-2 w-full overflow-y-auto">
                <NavButton view="dashboard" label="الإدارة" icon={<UsersIcon className="w-6 h-6" />} isCollapsed={isNavCollapsed} onClick={() => setIsMobileNavOpen(false)} />
                <NavButton view="quickInvite" label="دعوة سريعة" icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>} isCollapsed={isNavCollapsed} onClick={() => setIsMobileNavOpen(false)} />
                <NavButton view="designs" label="التصاميم" icon={<BrushIcon className="w-6 h-6" />} isCollapsed={isNavCollapsed} onClick={() => setIsMobileNavOpen(false)} />
                {currentUser.role === 'admin' && (
                <NavButton view="users" label="المستخدمين" icon={<UserCircleIcon className="w-6 h-6" />} isCollapsed={isNavCollapsed} onClick={() => setIsMobileNavOpen(false)} />
                )}
                <NavButton view="scanner" label="المسح" icon={<ScanIcon className="w-6 h-6" />} isCollapsed={isNavCollapsed} onClick={() => setIsMobileNavOpen(false)} />
                <NavButton view="reporting" label="التقارير" icon={<ChartBarIcon className="w-6 h-6" />} isCollapsed={isNavCollapsed} onClick={() => setIsMobileNavOpen(false)} />
            </div>

            <div className={`p-4 border-t ${theme === 'dark' ? 'border-slate-800' : 'border-gray-200'} flex-shrink-0 space-y-2`}>
                <button
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
                    className={`flex items-center w-full p-3 transition-all duration-200 rounded-lg ${
                      theme === 'dark' 
                        ? 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${isNavCollapsed ? 'justify-center' : 'justify-start'}`}
                >
                    {theme === 'dark' ? (
                      <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                    {!isNavCollapsed && <span className="text-sm font-bold ms-4 whitespace-nowrap">{theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>}
                </button>
                <button
                    onClick={handleLogout}
                    title="تسجيل الخروج"
                    className={`flex items-center w-full p-3 transition-colors duration-200 rounded-lg group text-slate-500 hover:bg-red-900/50 hover:text-red-400 ${isNavCollapsed ? 'justify-center' : 'justify-start'}`}
                >
                    <LogoutIcon className="w-6 h-6 flex-shrink-0" />
                    {!isNavCollapsed && <span className="text-sm font-bold ms-4 whitespace-nowrap">خروج</span>}
                </button>
            </div>
        </nav>
        <main className="flex-1 overflow-y-auto">
            <header className="sticky top-0 z-10 lg:hidden bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-between border-b border-slate-800">
                <h1 className="text-lg font-bold text-white">
                    منظم <span className="text-teal-400">الدعوات</span>
                </h1>
                <button
                    onClick={() => setIsMobileNavOpen(true)}
                    className="p-2 text-slate-300 hover:bg-slate-800 rounded-md"
                    aria-label="افتح القائمة"
                >
                    <MenuIcon className="w-6 h-6" />
                </button>
            </header>
            {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
