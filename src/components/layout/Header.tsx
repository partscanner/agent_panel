import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import logo from '../../assets/logo.png';

export const Header = () => {
  const { t } = useTranslation();
  const { agent, logout } = useAuth();

  return (
    <header className="bg-white border-b border-neutral-200 shadow-soft px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
          <h1 className="text-lg font-semibold text-neutral-900 hidden sm:block">
            {t('app.title')}
          </h1>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {agent && (
            <>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-neutral-700">{agent.name}</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
              >
                {t('auth.logout')}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

