import { useCallback } from 'react';
import { useTranslation } from 'react-i18next'; // O la librería que estés usando

export const useRelativeDate = () => {
  const { t } = useTranslation();

  // Envolvemos la función retornada en useCallback
  // 't' es la única dependencia externa

  return useCallback(
    (timestamp: number): string => {
      const fecha = new Date(timestamp);
      const hoy = new Date();

      const msPerDay = 1000 * 60 * 60 * 24;
      const diffMs =
        new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime() -
        new Date(
          fecha.getFullYear(),
          fecha.getMonth(),
          fecha.getDate()
        ).getTime();
      const dias = Math.round(diffMs / msPerDay);

      console.log(timestamp, dias)
      if (dias === 0) return t('common.today');
      if (dias === 1) return t('common.yesterday');
      if (dias === 2) return t('common.twoDaysAgo');
      if (dias < 7) return t('common.daysAgo', { count: dias });
      if (dias < 14) return t('common.weekAgo');
      return t('common.weeksAgo', { count: Math.floor(dias / 7) });
    },
    [t]
  );
};;
