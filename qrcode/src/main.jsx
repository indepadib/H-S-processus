import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import QRCodeStyling from "qr-code-styling";
import { Download, RotateCcw, Upload, QrCode, Palette, Image as ImageIcon, AlertTriangle } from "lucide-react";
import "./styles.css";

const DEFAULTS = {
  data: "https://example.com",
  qrColor: "#111111",
  backgroundColor: "#ffffff",
  accentColor: "#F15A24",
  size: 360,
  style: "rounded",
  logo: "",
};

const STYLE_OPTIONS = {
  classic: {
    label: "Classique carré",
    dotsOptions: { type: "square" },
    cornersSquareOptions: { type: "square" },
    cornersDotOptions: { type: "square" },
  },
  rounded: {
    label: "Arrondi",
    dotsOptions: { type: "rounded" },
    cornersSquareOptions: { type: "extra-rounded" },
    cornersDotOptions: { type: "dot" },
  },
  dots: {
    label: "Points ronds",
    dotsOptions: { type: "dots" },
    cornersSquareOptions: { type: "extra-rounded" },
    cornersDotOptions: { type: "dot" },
  },
  extraRounded: {
    label: "Extra arrondi",
    dotsOptions: { type: "extra-rounded" },
    cornersSquareOptions: { type: "extra-rounded" },
    cornersDotOptions: { type: "dot" },
  },
};

function Field({ label, children, icon: Icon }) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        <span>{label}</span>
      </div>
      {children}
    </label>
  );
}

function App() {
  const previewRef = useRef(null);
  const qrRef = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(DEFAULTS);
  const [logoName, setLogoName] = useState("");

  const qrOptions = useMemo(() => {
    const style = STYLE_OPTIONS[form.style] || STYLE_OPTIONS.rounded;

    return {
      width: Number(form.size),
      height: Number(form.size),
      type: "svg",
      data: form.data?.trim() || DEFAULTS.data,
      image: form.logo || undefined,
      margin: 16,
      qrOptions: {
        errorCorrectionLevel: "H",
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 8,
        imageSize: 0.28,
        hideBackgroundDots: true,
      },
      dotsOptions: {
        color: form.qrColor,
        ...style.dotsOptions,
      },
      backgroundOptions: {
        color: form.backgroundColor,
      },
      cornersSquareOptions: {
        color: form.qrColor,
        ...style.cornersSquareOptions,
      },
      cornersDotOptions: {
        color: form.qrColor,
        ...style.cornersDotOptions,
      },
    };
  }, [form]);

  useEffect(() => {
    if (!previewRef.current) return;

    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling(qrOptions);
      previewRef.current.innerHTML = "";
      qrRef.current.append(previewRef.current);
      return;
    }

    qrRef.current.update(qrOptions);
  }, [qrOptions]);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Veuillez importer une image valide : PNG, JPG, SVG, WebP...");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      update("logo", reader.result);
      setLogoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setForm(DEFAULTS);
    setLogoName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const download = (extension) => {
    if (!qrRef.current) return;
    qrRef.current.download({ name: "qr-code-studio", extension });
  };

  return (
    <main className="min-h-screen bg-[#f7f2ea] text-slate-950">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
        <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
              <QrCode className="h-4 w-4" />
              Générateur simple · Sans backend
            </div>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">QR Code Studio</h1>
            <p className="mt-3 max-w-2xl text-lg text-slate-600">
              Générez des QR codes personnalisés, propres et prêts à être utilisés.
            </p>
          </div>

          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Configuration</h2>
                <p className="text-sm text-slate-500">Modifiez, prévisualisez, téléchargez.</p>
              </div>
              <div
                className="h-10 w-10 rounded-2xl"
                style={{ backgroundColor: form.accentColor }}
                aria-hidden="true"
              />
            </div>

            <div className="space-y-5">
              <Field label="Contenu à encoder" icon={QrCode}>
                <textarea
                  value={form.data}
                  onChange={(e) => update("data", e.target.value)}
                  rows={4}
                  placeholder="https://votre-site.com ou texte libre"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Couleur QR" icon={Palette}>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                    <input
                      type="color"
                      value={form.qrColor}
                      onChange={(e) => update("qrColor", e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-xl border-0 bg-transparent"
                    />
                    <input
                      value={form.qrColor}
                      onChange={(e) => update("qrColor", e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold outline-none"
                    />
                  </div>
                </Field>

                <Field label="Fond" icon={Palette}>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                    <input
                      type="color"
                      value={form.backgroundColor}
                      onChange={(e) => update("backgroundColor", e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-xl border-0 bg-transparent"
                    />
                    <input
                      value={form.backgroundColor}
                      onChange={(e) => update("backgroundColor", e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold outline-none"
                    />
                  </div>
                </Field>
              </div>

              <Field label="Style visuel" icon={Palette}>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(STYLE_OPTIONS).map(([key, option]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update("style", key)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        form.style === key
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={`Taille du QR : ${form.size}px`} icon={QrCode}>
                <input
                  type="range"
                  min="220"
                  max="720"
                  step="20"
                  value={form.size}
                  onChange={(e) => update("size", Number(e.target.value))}
                  className="w-full accent-slate-950"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>220px</span>
                  <span>720px</span>
                </div>
              </Field>

              <Field label="Logo central" icon={ImageIcon}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:bg-white"
                >
                  <Upload className="h-4 w-4" />
                  {logoName || "Importer un logo"}
                </button>
                {form.logo ? (
                  <button
                    type="button"
                    onClick={() => {
                      update("logo", "");
                      setLogoName("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="mt-2 text-sm font-semibold text-slate-500 underline underline-offset-4 hover:text-slate-950"
                  >
                    Retirer le logo
                  </button>
                ) : null}
              </Field>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => download("png")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Download className="h-4 w-4" />
                  PNG
                </button>
                <button
                  onClick={() => download("svg")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Download className="h-4 w-4" />
                  SVG
                </button>
              </div>
            </div>
          </aside>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-black">Aperçu</h2>
                <p className="text-sm text-slate-500">Le QR se met à jour automatiquement.</p>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                Correction d’erreur : H
              </div>
            </div>

            <div className="flex min-h-[520px] items-center justify-center rounded-[1.5rem] border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-6">
              <div
                ref={previewRef}
                className="flex items-center justify-center rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/80"
                style={{ maxWidth: "100%", overflow: "auto" }}
              />
            </div>

            <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                <strong>Conseil :</strong> testez toujours votre QR code avant impression, surtout si vous ajoutez un logo,
                utilisez une couleur claire ou imprimez en petit format.
              </p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
