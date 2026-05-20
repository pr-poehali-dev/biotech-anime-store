import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import func2url from "../../backend/func2url.json";

const TASKS_URL = (func2url as Record<string, string>)["tasks"];
const ENGINEERS_URL = (func2url as Record<string, string>)["engineers"];

export type Task = {
  id: number;
  title: string;
  description: string | null;
  customer: string | null;
  address: string | null;
  price: number;
  deadline: string | null;
  engineer_id: number | null;
  engineer_name: string | null;
  engineer_specialty: string | null;
  status: string;
  engineer_report: string | null;
  report_at: string | null;
  accepted_at: string | null;
  rejection_reason: string | null;
  created_at: string;
};

type Engineer = { id: number; name: string; login: string; phone?: string; specialty?: string };

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  new: { label: "Новая", cls: "bg-slate-100 text-slate-700" },
  assigned: { label: "Назначена", cls: "bg-blue-100 text-blue-700" },
  in_progress: { label: "В работе", cls: "bg-amber-100 text-amber-700" },
  reported: { label: "Сдана инженером", cls: "bg-violet-100 text-violet-700" },
  accepted: { label: "Принята", cls: "bg-green-100 text-green-700" },
  archived: { label: "Архив", cls: "bg-slate-50 text-slate-400" },
};

const ENG_KEY = "engineer_auth_v1";

export default function TasksPage() {
  const { settings } = useSiteSettings();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [engineer, setEngineer] = useState<Engineer | null>(null);
  const [engPwd, setEngPwd] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [reportFor, setReportFor] = useState<Task | null>(null);
  const [reportText, setReportText] = useState("");

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(TASKS_URL);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    try {
      const raw = localStorage.getItem(ENG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setEngineer(parsed.engineer);
        setEngPwd(parsed.password);
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const handleLogin = async () => {
    setLoginError("");
    try {
      const res = await fetch(ENGINEERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", login: loginForm.login, password: loginForm.password }),
      });
      const data = await res.json();
      if (data.success && data.engineer) {
        setEngineer(data.engineer);
        setEngPwd(loginForm.password);
        localStorage.setItem(ENG_KEY, JSON.stringify({ engineer: data.engineer, password: loginForm.password }));
        setShowLogin(false);
        setLoginForm({ login: "", password: "" });
      } else {
        setLoginError("Неверный логин или пароль");
      }
    } catch {
      setLoginError("Ошибка подключения");
    }
  };

  const logout = () => {
    setEngineer(null);
    setEngPwd("");
    localStorage.removeItem(ENG_KEY);
  };

  const takeTask = async (t: Task) => {
    if (!engineer) return;
    await fetch(TASKS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Engineer-Login": engineer.login,
        "X-Engineer-Password": engPwd,
      },
      body: JSON.stringify({ action: "take", id: t.id }),
    });
    loadTasks();
  };

  const submitReport = async () => {
    if (!engineer || !reportFor) return;
    await fetch(TASKS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Engineer-Login": engineer.login,
        "X-Engineer-Password": engPwd,
      },
      body: JSON.stringify({ action: "report", id: reportFor.id, report: reportText }),
    });
    setReportFor(null);
    setReportText("");
    loadTasks();
  };

  const visibleTasks = tasks.filter((t) => t.status !== "archived");

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-black" style={{ fontFamily: "Montserrat, sans-serif" }}>
            {settings.texts.tasksTitle}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Открытая база задач для партнёров-инженеров. Просмотр доступен всем.
          </p>
        </div>
        <div>
          {engineer ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <Icon name="UserCheck" size={16} className="text-green-700" />
              <div>
                <div className="text-xs text-green-900 font-semibold">{engineer.name}</div>
                {engineer.specialty && <div className="text-[10px] text-green-700">{engineer.specialty}</div>}
              </div>
              <button onClick={logout} className="ml-2 text-xs text-green-800 hover:underline">Выйти</button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="bear-btn bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm"
            >
              <Icon name="LogIn" size={16} />
              Вход для инженеров
            </button>
          )}
        </div>
      </div>

      {showLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
            <h2 className="font-black text-lg mb-4">Вход для инженера</h2>
            <div className="space-y-3">
              <input
                placeholder="Логин"
                value={loginForm.login}
                onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="password"
                placeholder="Пароль"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm"
              />
              {loginError && <div className="text-red-600 text-xs">{loginError}</div>}
              <div className="flex gap-2">
                <button onClick={handleLogin} className="bear-btn flex-1 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm">Войти</button>
                <button onClick={() => setShowLogin(false)} className="flex-1 border border-border py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary">Отмена</button>
              </div>
              <p className="text-xs text-muted-foreground text-center">Доступы выдаёт администратор</p>
            </div>
          </div>
        </div>
      )}

      {reportFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
            <h2 className="font-black text-lg mb-1">Отчёт о выполнении</h2>
            <div className="text-sm text-muted-foreground mb-3">«{reportFor.title}»</div>
            <textarea
              rows={6}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Что сделано, какие материалы использовали, рекомендации заказчику..."
              className="w-full border border-border rounded-xl px-3 py-2 text-sm resize-none"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={submitReport} className="bear-btn flex-1 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm">Сдать на приёмку</button>
              <button onClick={() => { setReportFor(null); setReportText(""); }} className="flex-1 border border-border py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
      ) : visibleTasks.length === 0 ? (
        <div className="text-center py-16 bg-white border border-border rounded-2xl">
          <div className="text-5xl mb-3">📭</div>
          <div className="font-bold">Пока задач нет</div>
          <div className="text-sm text-muted-foreground">Администратор скоро добавит новые задачи</div>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((t) => {
            const st = STATUS_LABELS[t.status] || STATUS_LABELS.new;
            const isMine = engineer && t.engineer_id === engineer.id;
            const canTake = engineer && (t.status === "new" || (!t.engineer_id && t.status !== "accepted"));
            const canReport = isMine && (t.status === "in_progress" || t.status === "assigned");

            return (
              <div key={t.id} className="bg-white border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      {t.price > 0 && <span className="text-xs font-bold text-green-700">{t.price.toLocaleString("ru-RU")} ₽</span>}
                      {t.deadline && <span className="text-xs text-muted-foreground">до {new Date(t.deadline).toLocaleDateString("ru-RU")}</span>}
                    </div>
                    <h3 className="font-black text-lg">{t.title}</h3>
                    {t.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{t.description}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground mt-3">
                  {t.customer && <div><Icon name="User" size={12} className="inline mr-1" />Заказчик: <span className="text-foreground font-semibold">{t.customer}</span></div>}
                  {t.address && <div><Icon name="MapPin" size={12} className="inline mr-1" />Адрес: <span className="text-foreground">{t.address}</span></div>}
                  {t.engineer_name && <div><Icon name="HardHat" size={12} className="inline mr-1" fallback="User" />Инженер: <span className="text-foreground font-semibold">{t.engineer_name}</span></div>}
                </div>

                {t.engineer_report && (
                  <div className="mt-3 bg-violet-50 border border-violet-200 rounded-xl p-3">
                    <div className="text-xs font-bold text-violet-800 mb-1">Отчёт инженера:</div>
                    <div className="text-sm text-violet-900 whitespace-pre-wrap">{t.engineer_report}</div>
                  </div>
                )}

                {t.rejection_reason && t.status !== "accepted" && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
                    <div className="text-xs font-bold text-red-800 mb-1">Замечание от админа:</div>
                    <div className="text-sm text-red-900">{t.rejection_reason}</div>
                  </div>
                )}

                {engineer && (canTake || canReport) && (
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {canTake && !isMine && (
                      <button onClick={() => takeTask(t)} className="bear-btn bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                        <Icon name="Hand" size={14} /> Взять в работу
                      </button>
                    )}
                    {canReport && (
                      <button onClick={() => { setReportFor(t); setReportText(t.engineer_report || ""); }} className="bear-btn bg-violet-600 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                        <Icon name="Send" size={14} /> Сдать отчёт
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
