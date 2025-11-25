import { useTranslation } from 'react-i18next';

export const LoadingSpinner = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-sm text-gray-600">{t('common.loading')}</p>
      </div>
    </div>
  );
};

