"use client";

import { useEffect, useState } from "react";
import api from "../lib/api";
import { DEFAULT_PUBLIC_QUOTE_CATEGORIES, normalizePublicQuoteCategories } from "./public-settings";

export function usePublicQuoteCategories() {
  const [categories, setCategories] = useState([...DEFAULT_PUBLIC_QUOTE_CATEGORIES]);

  useEffect(() => {
    let active = true;
    void api
      .get<unknown>("/public/config/quotes-categories")
      .then(({ data }) => {
        if (active) setCategories(normalizePublicQuoteCategories(data));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return categories;
}
