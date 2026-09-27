import { ApiError } from '../../../../utils/ApiError.js';
import { Admin } from '../models/Admin.js';
import {
  DRIVER_TERMS_KEY,
  LEGAL_DOCUMENT_KEYS,
  LegalDocument,
  TERMS_KEY,
  isKnownLegalKey,
} from '../models/LegalDocument.js';

const serializeLegalDocument = (doc) => ({
  key: doc.key,
  title: doc.title || '',
  content: doc.content || '',
  version: Number(doc.version || 1),
  published: doc.published !== false,
  updatedByName: doc.updatedByName || '',
  updatedAt: doc.updatedAt || null,
});

/// Validates a key against the registry. Rejecting unknown keys keeps the
/// collection to the documents we actually ship.
const resolveKey = (rawKey) => {
  const key = String(rawKey || '').trim().toLowerCase();

  if (!isKnownLegalKey(key)) {
    throw new ApiError(404, `Unknown legal document '${rawKey}'`);
  }

  return key;
};

/// Returns the stored document, creating an empty row the first time so the
/// admin screen always has something to edit rather than a 404 to handle.
const loadOrCreate = async (key) => {
  const existing = await LegalDocument.findOne({ key });
  if (existing) return existing;

  return LegalDocument.create({
    key,
    title: LEGAL_DOCUMENT_KEYS[key].defaultTitle,
    content: '',
    version: 1,
    published: true,
  });
};

const readForAdmin = async (req, res, key) => {
  const doc = await loadOrCreate(key);

  res.json({
    success: true,
    data: serializeLegalDocument(doc),
  });
};

/// The version is bumped only when the body actually changes, so re-saving the
/// title or toggling publication does not make every app think the document was
/// reissued.
const writeForAdmin = async (req, res, key) => {
  const { title, content, published } = req.body;

  if (content !== undefined && typeof content !== 'string') {
    throw new ApiError(400, 'content must be text');
  }

  const doc = await loadOrCreate(key);

  if (title !== undefined) {
    doc.title = String(title || '').trim() || LEGAL_DOCUMENT_KEYS[key].defaultTitle;
  }

  if (content !== undefined) {
    const nextContent = String(content);
    if (nextContent !== (doc.content || '')) {
      doc.content = nextContent;
      doc.version = Number(doc.version || 1) + 1;
    }
  }

  if (published !== undefined) {
    doc.published = published !== false;
  }

  // Recorded so the panel can show who last touched the document.
  const admin = await Admin.findById(req.auth?.sub).select('name email').lean();
  doc.updatedByName = admin?.name || admin?.email || '';

  await doc.save();

  res.json({
    success: true,
    message: 'Saved',
    data: serializeLegalDocument(doc),
  });
};

/// An unpublished or never-written document returns empty content rather than
/// an error, so the apps can fall back to their bundled copy.
const readPublic = async (req, res, key) => {
  const doc = await LegalDocument.findOne({ key }).lean();

  const available = Boolean(doc && doc.published !== false && String(doc.content || '').trim());

  res.json({
    success: true,
    data: {
      key,
      title: doc?.title || LEGAL_DOCUMENT_KEYS[key].defaultTitle,
      content: available ? doc.content : '',
      version: Number(doc?.version || 0),
      available,
      updatedAt: doc?.updatedAt || null,
    },
  });
};

// --- Keyed routes ---------------------------------------------------------

export const getLegalDocumentForAdmin = (req, res) =>
  readForAdmin(req, res, resolveKey(req.params.key));

export const updateLegalDocumentForAdmin = (req, res) =>
  writeForAdmin(req, res, resolveKey(req.params.key));

export const getPublicLegalDocument = (req, res) =>
  readPublic(req, res, resolveKey(req.params.key));

// --- Fixed-key routes -----------------------------------------------------
// The rider app already ships pointing at the un-keyed `/common/legal/terms`,
// so that path keeps working rather than breaking installed builds.

export const getTermsForAdmin = (req, res) => readForAdmin(req, res, TERMS_KEY);
export const updateTermsForAdmin = (req, res) => writeForAdmin(req, res, TERMS_KEY);
export const getPublicTerms = (req, res) => readPublic(req, res, TERMS_KEY);
export const getPublicDriverTerms = (req, res) => readPublic(req, res, DRIVER_TERMS_KEY);
