import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type MenuItem = { id: string; label: string; page: string };

export type ContactItem = {
  icon: string;
  label: string;
  value: string;
  sub: string;
};

export type PageTexts = {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroBadge: string;
  veteransBannerTitle: string;
  veteransBannerText: string;
  servicesPromoTitle: string;
  servicesPromoText: string;
  contactsTitle: string;
  contactsFormTitle: string;
  deliveryTitle: string;
  veteransTitle: string;
  servicesTitle: string;
  catalogTitle: string;
  footerText: string;
};

export type SiteSettings = {
  siteName: string;
  siteSubtitle: string;
  siteFullName: string;
  menu: MenuItem[];
  contacts: ContactItem[];
  texts: PageTexts;
};

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Товары · Услуги · Ветеранам",
  siteSubtitle: "МТМ Маркет «Максимум технологий „Мишка“»",
  siteFullName: "МТМ Маркет «Максимум технологий „Мишка“»",
  menu: [
    { id: "home", label: "Главная", page: "home" },
    { id: "catalog", label: "Каталог", page: "catalog" },
    { id: "services", label: "Услуги", page: "services" },
    { id: "veterans", label: "Ветеранам СВО", page: "veterans" },
    { id: "delivery", label: "Доставка и оплата", page: "delivery" },
    { id: "contacts", label: "Контакты", page: "contacts" },
  ],
  contacts: [
    { icon: "Phone", label: "Телефон", value: "+7 (800) 000-00-00", sub: "Бесплатный звонок по России" },
    { icon: "Mail", label: "Email", value: "info@mtb-market.ru", sub: "Ответим в течение 24 часов" },
    { icon: "MapPin", label: "Адрес", value: "Благовещенск, Амурская область", sub: "Пн–Пт: 9:00–18:00" },
    { icon: "Clock", label: "Режим работы", value: "Пн–Пт 9:00–18:00", sub: "Сб–Вс: выходной" },
  ],
  texts: {
    heroTitle: "МТМ Маркет",
    heroSubtitle: "«Максимум технологий „Мишка“»",
    heroDescription: "Передовые биотехнологические продукты для вашего здоровья. Лицензированная продукция, доставка по всей России.",
    heroBadge: "Официальный маркетплейс",
    veteransBannerTitle: "Товары для ветеранов СВО",
    veteransBannerText: "Бесплатные и льготные биотехнологические продукты для восстановления здоровья участников специальной военной операции",
    servicesPromoTitle: "Услуги профессионалов",
    servicesPromoText: "Ремонт ПК, установка ПО, техническое обслуживание",
    contactsTitle: "Контакты",
    contactsFormTitle: "Написать нам",
    deliveryTitle: "Доставка и оплата",
    veteransTitle: "Товары для ветеранов СВО",
    servicesTitle: "Услуги профессионалов",
    catalogTitle: "Каталог товаров",
    footerText: "© МТМ Маркет «Максимум технологий „Мишка“». Все права защищены.",
  },
};

const STORAGE_KEY = "site_settings_v1";

type Ctx = {
  settings: SiteSettings;
  updateSettings: (patch: Partial<SiteSettings>) => void;
  updateTexts: (patch: Partial<PageTexts>) => void;
  setMenu: (menu: MenuItem[]) => void;
  setContacts: (contacts: ContactItem[]) => void;
  resetToDefault: () => void;
};

const SiteSettingsContext = createContext<Ctx | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          texts: { ...DEFAULT_SETTINGS.texts, ...(parsed.texts || {}) },
        };
      }
    } catch (e) {
      console.warn("settings load failed", e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn("settings save failed", e);
    }
  }, [settings]);

  const updateSettings = (patch: Partial<SiteSettings>) =>
    setSettings((s) => ({ ...s, ...patch }));

  const updateTexts = (patch: Partial<PageTexts>) =>
    setSettings((s) => ({ ...s, texts: { ...s.texts, ...patch } }));

  const setMenu = (menu: MenuItem[]) =>
    setSettings((s) => ({ ...s, menu }));

  const setContacts = (contacts: ContactItem[]) =>
    setSettings((s) => ({ ...s, contacts }));

  const resetToDefault = () => setSettings(DEFAULT_SETTINGS);

  return (
    <SiteSettingsContext.Provider value={{ settings, updateSettings, updateTexts, setMenu, setContacts, resetToDefault }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  return ctx;
}