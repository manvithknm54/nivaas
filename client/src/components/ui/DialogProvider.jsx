import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, HelpCircle } from "lucide-react";

const Ctx = createContext(null);
export const useDialog = () => useContext(Ctx);

export function DialogProvider({ children }) {
  const [dlg, setDlg] = useState(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const resolver = useRef(null);

  const open = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setValue("");
        setError("");
        setDlg(opts);
      }),
    []
  );

  const close = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDlg(null);
  };

  const api = useMemo(
    () => ({
      confirmAction: (o) => open({ kind: "confirm", ...o }), // resolves true / false
      askText: (o) => open({ kind: "ask", ...o }), // resolves the text / null
    }),
    [open]
  );

  const cancel = () => close(dlg?.kind === "ask" ? null : false);

  const submit = (e) => {
    e.preventDefault();
    if (dlg.kind === "confirm") return close(true);
    const v = value.trim();
    const min = dlg.minLength ?? 1;
    if (v.length < min) {
      return setError(min > 1 ? `Please enter at least ${min} characters` : "This field is required");
    }
    close(v);
  };

  useEffect(() => {
    if (!dlg) return;
    const onKey = (e) => e.key === "Escape" && cancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dlg]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <AnimatePresence>
        {dlg && (
          <motion.div
            className="fixed inset-0 z-[70] grid place-items-center bg-ink-950/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancel}
          >
            <motion.form
              onSubmit={submit}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
              initial={{ y: 16, scale: 0.97, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 16, scale: 0.97, opacity: 0 }}
            >
              <div className={`grid h-11 w-11 place-items-center rounded-full ${dlg.danger ? "bg-red-100 text-red-600" : "bg-gold-400/25 text-gold-500"}`}>
                {dlg.danger ? <AlertTriangle size={22} /> : <HelpCircle size={22} />}
              </div>
              <h2 className="mt-4 text-lg font-extrabold">{dlg.title}</h2>
              {dlg.message && <p className="mt-1.5 text-sm leading-relaxed text-ink-900/60">{dlg.message}</p>}

              {dlg.kind === "ask" && (
                <div className="mt-4">
                  {dlg.label && <label className="label">{dlg.label}</label>}
                  <input
                    autoFocus
                    className="input"
                    maxLength={200}
                    placeholder={dlg.placeholder}
                    value={value}
                    onChange={(e) => { setValue(e.target.value); setError(""); }}
                  />
                  {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={cancel}>{dlg.cancelText || "Cancel"}</button>
                <button type="submit" autoFocus={dlg.kind === "confirm"} className={dlg.danger ? "btn-danger" : "btn-gold"}>
                  {dlg.confirmText || "Confirm"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}