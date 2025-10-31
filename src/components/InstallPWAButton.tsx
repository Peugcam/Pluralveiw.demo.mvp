import { usePWA } from '../hooks/usePWA';
import type { InstallPWAButtonProps } from '@/types';

/**
 * Componente de botão para instalar PWA
 */
export default function InstallPWAButton({ className = '' }: InstallPWAButtonProps) {
  const { isInstallable, promptInstall, isInstalled } = usePWA();

  // Não mostrar se já está instalado
  if (isInstalled) {
    return null;
  }

  // Não mostrar se não for instalável
  if (!isInstallable) {
    return null;
  }

  return (
    <button
      onClick={promptInstall}
      className={`
        px-6 py-3 rounded-lg font-semibold transition-all
        bg-gradient-to-r from-blue-500 to-purple-600
        hover:from-blue-600 hover:to-purple-700
        flex items-center gap-2
        ${className}
      `}
      aria-label="Instalar PluralView como app"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      <span>Instalar App</span>
    </button>
  );
}
