import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import func2url from "../../backend/func2url.json";

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
  tasksTitle: string;
};

export type SiteSettings = {
  siteName: string;
  siteSubtitle: string;
  siteFullName: string;
  menu: MenuItem[];
  contacts: ContactItem[];
  texts: PageTexts;
  sbpLink: string;
  sbpQrImage: string;
  categories: Category[];
};

export type Category = { name: string; icon: string };

export const DEFAULT_CATEGORIES: Category[] = [
  { name: "Биотехнологии", icon: "🧬" },
  { name: "Нутрицевтика", icon: "💊" },
  { name: "Детокс", icon: "🌿" },
  { name: "Компьютеры", icon: "💻" },
  { name: "Одежда и обувь", icon: "👟" },
  { name: "Услуги", icon: "🔧" },
  { name: "Ветеранам", icon: "🎖️" },
];

export function normalizeCategories(raw: unknown): Category[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_CATEGORIES;
  return raw.map((c) =>
    typeof c === "string" ? { name: c, icon: "🐻" } : { name: c.name || "", icon: c.icon || "🐻" }
  ).filter((c) => c.name);
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Товары · Услуги · Ветеранам",
  siteSubtitle: "МТМ Маркет «Максимум технологий „Мишка“»",
  siteFullName: "МТМ Маркет «Максимум технологий „Мишка“»",
  menu: [
    { id: "home", label: "Главная", page: "home" },
    { id: "catalog", label: "Каталог", page: "catalog" },
    { id: "services", label: "Услуги", page: "services" },
    { id: "tasks", label: "Задачи", page: "tasks" },
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
    tasksTitle: "Задачи для инженеров",
  },
  sbpLink: "",
  sbpQrImage: "",
  categories: DEFAULT_CATEGORIES,
};

const SETTINGS_URL = (func2url as Record<string, string>)["settings"];

type Ctx = {
  settings: SiteSettings;
  loading: boolean;
  updateSettings: (patch: Partial<SiteSettings>, adminPassword: string) => Promise<void>;
  updateTexts: (patch: Partial<PageTexts>, adminPassword: string) => Promise<void>;
  setMenu: (menu: MenuItem[], adminPassword: string) => Promise<void>;
  setContacts: (contacts: ContactItem[], adminPassword: string) => Promise<void>;
  setCategories: (categories: Category[], adminPassword: string) => Promise<void>;
  resetToDefault: (adminPassword: string) => Promise<void>;
};

const SiteSettingsContext = createContext<Ctx | null>(null);

function mergeWithDefaults(parsed: Partial<SiteSettings>): SiteSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    menu: parsed.menu && parsed.menu.length > 0 ? parsed.menu : DEFAULT_SETTINGS.menu,
    contacts: parsed.contacts && parsed.contacts.length > 0 ? parsed.contacts : DEFAULT_SETTINGS.contacts,
    texts: { ...DEFAULT_SETTINGS.texts, ...(parsed.texts || {}) },
    categories: normalizeCategories(parsed.categories),
  };
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    (async () => {
      try {
        const res = await fetch(SETTINGS_URL);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === "object" && Object.keys(data).length > 0) {
            setSettings(mergeWithDefaults(data));
          }
        }
      } catch (e) {
        console.warn("settings fetch failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (next: SiteSettings, adminPassword: string) => {
    setSettings(next);
    try {
      await fetch(SETTINGS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Password": adminPassword },
        body: JSON.stringify(next),
      });
    } catch (e) {
      console.warn("settings save failed", e);
    }
  };

  const updateSettings = async (patch: Partial<SiteSettings>, adminPassword: string) => {
    await save({ ...settings, ...patch }, adminPassword);
  };

  const updateTexts = async (patch: Partial<PageTexts>, adminPassword: string) => {
    await save({ ...settings, texts: { ...settings.texts, ...patch } }, adminPassword);
  };

  const setMenu = async (menu: MenuItem[], adminPassword: string) => {
    await save({ ...settings, menu }, adminPassword);
  };

  const setContacts = async (contacts: ContactItem[], adminPassword: string) => {
    await save({ ...settings, contacts }, adminPassword);
  };

  const setCategories = async (categories: Category[], adminPassword: string) => {
    await save({ ...settings, categories }, adminPassword);
  };

  const resetToDefault = async (adminPassword: string) => {
    await save(DEFAULT_SETTINGS, adminPassword);
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, updateSettings, updateTexts, setMenu, setContacts, setCategories, resetToDefault }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  return ctx;
}