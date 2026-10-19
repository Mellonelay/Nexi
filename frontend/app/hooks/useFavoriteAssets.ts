'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import api from '../lib/api';
import { normalizePair } from '../state/active-instrument';

type TradingSettings = Record<string, unknown>;
type PublicPreferences = { tradingSettings: TradingSettings | null };
type FavoriteStatus = 'LOADING' | 'READY' | 'SIGN_IN_REQUIRED' | 'UNAVAILABLE';

function normalizedFavoriteSymbol(symbol: string) {
  const normalized = normalizePair(symbol).toUpperCase();
  return normalized || null;
}

function favoriteSymbolsFrom(settings: TradingSettings | null) {
  const saved = settings?.favoriteAssetSymbols;
  if (!Array.isArray(saved)) return [];
  return [...new Set(saved.filter((value): value is string => typeof value === 'string')
    .map(normalizedFavoriteSymbol)
    .filter((value): value is string => value !== null))];
}

function statusFromError(error: unknown): Exclude<FavoriteStatus, 'LOADING' | 'READY'> {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return 'SIGN_IN_REQUIRED';
  }
  return 'UNAVAILABLE';
}

export function useFavoriteAssets() {
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>([]);
  const [status, setStatus] = useState<FavoriteStatus>('LOADING');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const tradingSettingsRef = useRef<TradingSettings>({});
  const favoriteSymbolSet = useMemo(() => new Set(favoriteSymbols), [favoriteSymbols]);

  useEffect(() => {
    let active = true;
    void api.get<PublicPreferences>('/auth/preferences').then(({ data }) => {
      if (!active) return;
      tradingSettingsRef.current = data.tradingSettings ?? {};
      setFavoriteSymbols(favoriteSymbolsFrom(tradingSettingsRef.current));
      setStatus('READY');
    }).catch((error: unknown) => {
      if (!active) return;
      setStatus(statusFromError(error));
    });
    return () => { active = false; };
  }, []);

  const isFavorite = useCallback((symbol: string) => {
    const normalized = normalizedFavoriteSymbol(symbol);
    return normalized !== null && favoriteSymbolSet.has(normalized);
  }, [favoriteSymbolSet]);

  const toggleFavorite = useCallback(async (symbol: string) => {
    const normalized = normalizedFavoriteSymbol(symbol);
    if (!normalized || status !== 'READY' || savingRef.current) return;

    const current = favoriteSymbols;
    const next = current.includes(normalized)
      ? current.filter((value) => value !== normalized)
      : [...current, normalized];

    savingRef.current = true;
    setSaving(true);
    setFavoriteSymbols(next);
    try {
      const response = await api.patch<PublicPreferences>('/auth/preferences', {
        tradingSettings: {
          ...tradingSettingsRef.current,
          favoriteAssetSymbols: next,
        },
      });
      tradingSettingsRef.current = response.data.tradingSettings ?? {
        ...tradingSettingsRef.current,
        favoriteAssetSymbols: next,
      };
      setFavoriteSymbols(favoriteSymbolsFrom(tradingSettingsRef.current));
      toast.success(next.includes(normalized) ? 'Added to favorites.' : 'Removed from favorites.');
    } catch {
      setFavoriteSymbols(current);
      toast.error('Could not update favorites. Try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [favoriteSymbols, status]);

  return { favoriteSymbols, status, saving, isFavorite, toggleFavorite };
}
