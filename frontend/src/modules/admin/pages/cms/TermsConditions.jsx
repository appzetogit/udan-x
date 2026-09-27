import React, { useCallback, useEffect, useState } from 'react';
import { FileText, Loader2, Save, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const BASE = (docKey) => `${globalThis.__LEGACY_BACKEND_ORIGIN__}/api/v1/admin/legal/${docKey}`;

const authHeaders = (extra = {}) => {
  const token = localStorage.getItem('adminToken');
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
};

const formatUpdatedAt = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
};

/**
 * Editor for one legal document, selected by `docKey`.
 *
 * The apps read the published text from `GET /common/legal/<key>`, so saving
 * here is what they show. Used for both the rider terms ('terms') and the
 * driver terms ('driver-terms').
 */
const TermsConditions = ({
  docKey = 'terms',
  heading = 'Terms & Conditions',
  subheading = 'Shown in the rider app',
  defaultTitle = 'Terms & Conditions',
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(true);

  // What the server last confirmed, so the unsaved-changes hint is accurate.
  const [saved, setSaved] = useState({ title: '', content: '', published: true });
  const [meta, setMeta] = useState({ version: 0, updatedAt: null, updatedByName: '' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(BASE(docKey), { headers: authHeaders() });
      if (!res.ok) throw new Error(`Could not load terms (${res.status})`);
      const json = await res.json();
      const doc = json?.data ?? {};

      setTitle(doc.title || defaultTitle);
      setContent(doc.content || '');
      setPublished(doc.published !== false);
      setSaved({
        title: doc.title || defaultTitle,
        content: doc.content || '',
        published: doc.published !== false,
      });
      setMeta({
        version: Number(doc.version || 0),
        updatedAt: doc.updatedAt || null,
        updatedByName: doc.updatedByName || '',
      });
    } catch (e) {
      setError(e.message || 'Could not load terms');
    } finally {
      setLoading(false);
    }
  }, [docKey, defaultTitle]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty =
    title !== saved.title || content !== saved.content || published !== saved.published;

  const save = async () => {
    if (!content.trim()) {
      setError('Write the terms before saving.');
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(BASE(docKey), {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ title, content, published }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Save failed (${res.status})`);
      }
      const json = await res.json();
      const doc = json?.data ?? {};

      setSaved({
        title: doc.title || title,
        content: doc.content ?? content,
        published: doc.published !== false,
      });
      setMeta({
        version: Number(doc.version || 0),
        updatedAt: doc.updatedAt || null,
        updatedByName: doc.updatedByName || '',
      });
      setNotice('Saved. The app will show this text.');
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const updatedAt = formatUpdatedAt(meta.updatedAt);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto pb-20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{heading}</h1>
          <p className="text-gray-400 font-bold text-[11px] mt-1 uppercase tracking-widest leading-none">
            {subheading}
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving || loading || !dirty}
          className="bg-black text-white px-6 py-2 rounded-lg text-[13px] font-bold hover:opacity-90 transition-all shadow-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-start gap-3 text-[13px] font-semibold">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {notice && !dirty && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex items-start gap-3 text-[13px] font-semibold">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <span>{notice}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex items-center justify-center text-gray-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {meta.version > 0 ? `Version ${meta.version}` : 'Not published yet'}
              </p>
              <p className="text-[12px] font-semibold text-gray-500 mt-0.5 truncate">
                {updatedAt
                  ? `Last updated ${updatedAt}${meta.updatedByName ? ` by ${meta.updatedByName}` : ''}`
                  : 'No edits recorded yet'}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={defaultTitle}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-500">Content</label>
                <span className="text-[11px] font-semibold text-gray-400">
                  {content.length.toLocaleString()} characters
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                placeholder="Write the terms and conditions your riders and drivers agree to…"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 bg-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-colors font-mono leading-relaxed resize-y"
              />
              <p className="text-[11px] font-semibold text-gray-400 mt-2">
                Plain text. Line breaks and blank lines are preserved exactly as typed.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPublished((v) => !v)}
              className="w-full flex items-center justify-between gap-4 border border-gray-200 rounded-xl px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-3">
                <span
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    published ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {published ? <Eye size={17} /> : <EyeOff size={17} />}
                </span>
                <span>
                  <span className="block text-[13px] font-bold text-gray-900">
                    {published ? 'Visible in the apps' : 'Hidden from the apps'}
                  </span>
                  <span className="block text-[11px] font-semibold text-gray-400 mt-0.5">
                    {published
                      ? 'Visible in the app now'
                      : 'Saved as a draft — the app shows nothing'}
                  </span>
                </span>
              </span>
              <span
                className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                  published ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    published ? 'translate-x-5' : ''
                  }`}
                />
              </span>
            </button>

            {dirty && (
              <p className="text-[12px] font-bold text-amber-600 flex items-center gap-2">
                <AlertCircle size={14} /> You have unsaved changes.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TermsConditions;
