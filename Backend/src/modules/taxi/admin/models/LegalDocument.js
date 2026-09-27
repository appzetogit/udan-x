import mongoose from 'mongoose';

/// A legal document the operator publishes to the apps — currently the app-wide
/// Terms & Conditions.
///
/// Keyed by slug rather than held as a single settings field so further
/// documents (privacy policy, refund policy) can be added later without another
/// migration. There is exactly one row per key.
const legalDocumentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      default: 'Terms & Conditions',
      trim: true,
    },
    /// Body text. Plain text with newlines — the apps render it as-is, so it is
    /// stored exactly as the admin typed it.
    content: {
      type: String,
      default: '',
    },
    /// Bumped on every save that changes the body, so a client can tell whether
    /// the terms it last showed are still current.
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    /// Unpublished documents are hidden from the apps but still editable.
    published: {
      type: Boolean,
      default: true,
    },
    updatedByName: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true },
);

export const LegalDocument =
  mongoose.models.TaxiLegalDocument || mongoose.model('TaxiLegalDocument', legalDocumentSchema);

/// The rider-facing terms. Kept as a named constant so the controller, the
/// public route and any seed script cannot drift apart on spelling.
export const TERMS_KEY = 'terms';

/// The driver-facing terms. Drivers agree to different things from riders —
/// document currency, trip acceptance, payouts — so the two are edited and
/// published independently rather than sharing one document.
export const DRIVER_TERMS_KEY = 'driver-terms';

/// Every document the admin may edit and the apps may read. Anything not
/// listed here is rejected, so a stray key in a URL cannot create rows.
export const LEGAL_DOCUMENT_KEYS = Object.freeze({
  [TERMS_KEY]: { defaultTitle: 'Terms & Conditions', audience: 'user' },
  [DRIVER_TERMS_KEY]: { defaultTitle: 'Driver Terms & Conditions', audience: 'driver' },
});

export const isKnownLegalKey = (key) =>
  Object.prototype.hasOwnProperty.call(LEGAL_DOCUMENT_KEYS, String(key || '').trim().toLowerCase());
