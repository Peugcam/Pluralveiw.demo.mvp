import { useEffect, useState } from 'react';
import type { UsePWAReturn } from '@/types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Hook para registrar e gerenciar PWA
 * @returns Estado e funções para gerenciar PWA
 */
export function usePWA(): UsePWAReturn {
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration);

          // Verificar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[PWA] New service worker installing...');

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New service worker available!');
                  setUpdateAvailable(true);
                  // Você pode mostrar uma notificação ao usuário aqui
                  if (confirm('Nova versão disponível! Deseja atualizar?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }

    // Detectar se app está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('[PWA] App is running in standalone mode');
      setIsInstalled(true);
      setIsStandalone(true);
    }

    // Capturar evento de instalação (beforeinstallprompt)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event fired');
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(promptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar quando app foi instalado
    const handleAppInstalled = () => {
      console.log('[PWA] App was installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Função para mostrar prompt de instalação
  const promptInstall = async (): Promise<void> => {
    if (!installPrompt) {
      console.warn('[PWA] No install prompt available');
      return;
    }

    // Mostrar prompt nativo
    await installPrompt.prompt();

    // Aguardar escolha do usuário
    const { outcome } = await installPrompt.userChoice;
    console.log(`[PWA] User choice: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
      setIsInstallable(false);
      setInstallPrompt(null);
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }
  };

  return {
    isInstallable,
    promptInstall,
    isInstalled,
    isStandalone,
    updateAvailable
  };
}
