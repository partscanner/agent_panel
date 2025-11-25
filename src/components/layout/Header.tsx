import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export const Header = () => {
  const { t } = useTranslation();
  const { agent, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">{t('app.title')}</h1>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {agent && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">{agent.name}</span>
              <button
                onClick={logout}
                className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {t('auth.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

