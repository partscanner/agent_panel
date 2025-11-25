import { useTranslation } from 'react-i18next';

export const LoadingSpinner = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-12 h-12 border-4 border-neutral-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-sm text-neutral-600 font-medium">{t('common.loading')}</p>
      </div>
    </div>
  );
};

