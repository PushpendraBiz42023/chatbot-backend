"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cosineSimilarity = cosineSimilarity;
/**
 * Pure cosine similarity between two equal-length numeric vectors:
 * dot product / (magnitude(a) * magnitude(b)). No external math library
 * needed for the vector sizes involved here (single embedding calls per
 * chat message against, at MVP scale, all stored knowledge chunks).
 *
 * Returns 0 for a zero-magnitude vector instead of NaN/Infinity, so a
 * malformed/empty stored embedding can never accidentally rank highest.
 */
function cosineSimilarity(a, b) {
    if (a.length !== b.length || a.length === 0) {
        return 0;
    }
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < a.length; i += 1) {
        dotProduct += a[i] * b[i];
        magnitudeA += a[i] * a[i];
        magnitudeB += b[i] * b[i];
    }
    const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
    if (denominator === 0) {
        return 0;
    }
    return dotProduct / denominator;
}
//# sourceMappingURL=similarity.js.map