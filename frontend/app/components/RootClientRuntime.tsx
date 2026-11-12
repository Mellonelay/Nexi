'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { recoverPublicSession } from '../lib/api';
import { hapticFeedback } from '../lib/haptics';
import { sessionPrincipalId } from '../lib/wallet-auth';

function useVisibleViewportHeight() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;
    const isTextEntry = (element: Element | null) =>
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement ||
      (element instanceof HTMLInputElement &&
        !['checkbox', 'radio', 'range', 'hidden', 'button', 'submit', 'reset', 'file'].includes(element.type)) ||
      (element instanceof HTMLElement && element.isContentEditable);

    const updateFocusedInput = (event?: FocusEvent) => {
      const element = event?.type === 'focusout' ? null : event?.target instanceof Element ? event.target : document.activeElement;
      root.classList.toggle('nexi-input-focused', isTextEntry(element));
    };
    const updateViewportHeight = () => {
      if (!viewport || viewport.scale > 1.01) {
        root.style.removeProperty('--nexi-visible-viewport-height');
        return;
      }
      root.style.setProperty('--nexi-visible-viewport-height', `${Math.round(viewport.height)}px`);
    };

    updateViewportHeight();
    updateFocusedInput();
    viewport?.addEventListener('resize', updateViewportHeight);
    viewport?.addEventListener('scroll', updateViewportHeight);
    window.addEventListener('resize', updateViewportHeight);
    document.addEventListener('focusin', updateFocusedInput);
    document.addEventListener('focusout', updateFocusedInput);
    return () => {
      viewport?.removeEventListener('resize', updateViewportHeight);
      viewport?.removeEventListener('scroll', updateViewportHeight);
      window.removeEventListener('resize', updateViewportHeight);
      document.removeEventListener('focusin', updateFocusedInput);
      document.removeEventListener('focusout', updateFocusedInput);
      root.classList.remove('nexi-input-focused');
      root.style.removeProperty('--nexi-visible-viewport-height');
    };
  }, []);
}

function tabIndexesForKey(currentIndex: number, count: number, vertical: boolean) {
  const forwardKey = vertical ? 'ArrowDown' : 'ArrowRight';
  const backwardKey = vertical ? 'ArrowUp' : 'ArrowLeft';
  return new Map<string, number>([
    ['Home', 0],
    ['End', count - 1],
    [forwardKey, (currentIndex + 1) % count],
    [backwardKey, (currentIndex - 1 + count) % count],
  ]);
}

function nextTabIndex(key: string, currentIndex: number, count: number, vertical: boolean) {
  if (count < 2 || currentIndex < 0) return null;
  return tabIndexesForKey(currentIndex, count, vertical).get(key) ?? null;
}

function moveTabOnKey(event: KeyboardEvent, target: HTMLElement) {
  const list = target.closest<HTMLElement>('[role="tablist"]');
  if (!list) return;
  const tabs = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]:not([aria-disabled="true"])'));
  const currentIndex = tabs.indexOf(target);
  const nextIndex = nextTabIndex(event.key, currentIndex, tabs.length, list.getAttribute('aria-orientation') === 'vertical');
  if (nextIndex === null) return;

  event.preventDefault();
  tabs.forEach((tab, index) => { tab.tabIndex = index === nextIndex ? 0 : -1; });
  tabs[nextIndex].focus();
  tabs[nextIndex].click();
}

function useTabKeyboardNavigation() {
  useEffect(() => {
    const onTabKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>('[role="tab"]') : null;
      if (target) moveTabOnKey(event, target);
    };
    document.addEventListener('keydown', onTabKeyDown);
    return () => document.removeEventListener('keydown', onTabKeyDown);
  }, []);
}

export default function RootClientRuntime() {
  useVisibleViewportHeight();
  useTabKeyboardNavigation();

  useEffect(() => {
    void recoverPublicSession();
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const selector = 'button:not(:disabled),a[href],[role="tab"],[role="button"],.nexi-interactive';
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(selector) : null;
      if (!target || target.matches('[aria-disabled="true"]')) return;
      hapticFeedback('selection');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    const socket = io(apiUrl, {
      autoConnect: true,
      transports: ['polling', 'websocket'],
      tryAllTransports: true,
    });
    const interval = setInterval(() => {
      socket.emit('heartbeat', { userId: sessionPrincipalId() });
    }, 30000);
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  return null;
}
