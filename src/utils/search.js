/**
 * Search utilities
 * Scores and filters MarkdownFile results against a query string.
 */

/**
 * Build a breadcrumb path string for a file given the collections tree.
 * Returns something like "Programming / React"
 */
export function buildBreadcrumb(collectionId, collections) {
  function findPath(id, nodes, path) {
    for (const node of nodes) {
      const current = [...path, node.name];
      if (node.id === id) return current;
      if (node.children && node.children.length > 0) {
        const found = findPath(id, node.children, current);
        if (found) return found;
      }
    }
    return null;
  }

  const parts = findPath(collectionId, collections, []);
  return parts ? parts.join(' / ') : '';
}

/**
 * Return array of ancestor node objects [{ id, name }] leading to collectionId.
 */
export function getCollectionPathNodes(collectionId, collections) {
  if (!collectionId) return [];
  function findPath(id, nodes, path) {
    for (const node of nodes) {
      const current = [...path, { id: node.id, name: node.name }];
      if (node.id === id) return current;
      if (node.children && node.children.length > 0) {
        const found = findPath(id, node.children, current);
        if (found) return found;
      }
    }
    return null;
  }
  return findPath(collectionId, collections, []) || [];
}

/**
 * Recursively find a collection node by id in a tree.
 */
export function findCollectionInTree(id, nodes) {
  if (!id || !nodes) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findCollectionInTree(id, node.children);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Normalise text for case-insensitive matching
 */
function normalise(str) {
  return (str || '').toLowerCase();
}

/**
 * Fast Levenshtein distance for typo tolerance
 */
export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = [];
  for (let i = 0; i <= b.length; i++) row[i] = i;

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      let val;
      if (a.charAt(i - 1) === b.charAt(j - 1)) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }

  return row[b.length];
}

/**
 * Extract clean word tokens from a query string
 */
export function tokenize(query) {
  if (!query) return [];
  return normalise(query)
    .split(/[\s,./\\_-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/**
 * Check if a token matches target word (exact, prefix, substring or fuzzy typo)
 */
function matchTokenInWords(token, words) {
  for (const word of words) {
    if (word === token) return { matched: true, exact: true };
    if (word.startsWith(token) || word.includes(token)) return { matched: true, exact: false };

    // Fuzzy matching for words with 4+ characters
    if (token.length >= 4 && word.length >= 3) {
      const maxDist = token.length >= 7 ? 2 : 1;
      if (levenshtein(token, word) <= maxDist) {
        return { matched: true, exact: false, fuzzy: true };
      }
    }
  }
  return { matched: false };
}

/**
 * Strip common markdown syntax to create clean readable snippets
 */
export function cleanMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^#+\s+/gm, '') // Remove heading hashes
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/^\s*[-*+]\s+/gm, '') // Unordered lists
    .replace(/^\s*\d+\.\s+/gm, '') // Ordered lists
    .replace(/^\s*>\s+/gm, '') // Blockquotes
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}

/**
 * Extract a relevant 2-line excerpt around the best matched search tokens
 */
export function extractSnippet(content, queryTokens, maxLength = 130) {
  if (!content || !queryTokens || queryTokens.length === 0) {
    const clean = cleanMarkdown(content || '');
    return clean.slice(0, maxLength) + (clean.length > maxLength ? '…' : '');
  }

  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  let bestLine = '';
  let maxScore = -1;
  let bestIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    let score = 0;
    for (const token of queryTokens) {
      if (lineLower.includes(token)) score += 2;
    }
    if (score > maxScore) {
      maxScore = score;
      bestLine = lines[i];
      bestIndex = i;
    }
  }

  if (!bestLine) {
    bestLine = lines[0] || '';
  }

  const cleanedLine = cleanMarkdown(bestLine);
  if (cleanedLine.length <= maxLength) {
    // If short, check if next line can provide more context
    if (bestIndex !== -1 && bestIndex + 1 < lines.length) {
      const nextClean = cleanMarkdown(lines[bestIndex + 1]);
      if (nextClean && cleanedLine.length + nextClean.length < maxLength) {
        return `${cleanedLine} — ${nextClean}`;
      }
    }
    return cleanedLine;
  }

  // Find position of the first matching token in cleaned line
  let firstPos = -1;
  const lowerCleaned = cleanedLine.toLowerCase();
  for (const token of queryTokens) {
    const idx = lowerCleaned.indexOf(token);
    if (idx !== -1 && (firstPos === -1 || idx < firstPos)) {
      firstPos = idx;
    }
  }

  if (firstPos === -1) {
    return cleanedLine.slice(0, maxLength) + '…';
  }

  // Slice around the matched token
  const start = Math.max(0, firstPos - 35);
  const end = Math.min(cleanedLine.length, firstPos + 75);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < cleanedLine.length ? '…' : '';

  return prefix + cleanedLine.slice(start, end).trim() + suffix;
}

/**
 * Split text into matched and unmatched segments for non-destructive visual highlighting
 * @returns {Array<{ text: string, isMatch: boolean }>}
 */
export function splitTextByMatches(text, queryTokens) {
  if (!text) return [];
  if (!queryTokens || queryTokens.length === 0) {
    return [{ text, isMatch: false }];
  }

  const cleanTokens = queryTokens.filter((t) => t && t.length > 0);
  if (cleanTokens.length === 0) return [{ text, isMatch: false }];

  const escaped = cleanTokens
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
    .join('|');

  if (!escaped) return [{ text, isMatch: false }];

  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts.filter(Boolean).map((part) => ({
    text: part,
    isMatch: cleanTokens.some((t) => normalise(t) === normalise(part)),
  }));
}

/**
 * Extract hashtags (#tag) from note content
 */
export function extractHashtags(content) {
  if (!content) return [];
  // Match #word but not markdown headings (which have space after #)
  const matches = content.match(/(?:^|\s)#([a-zA-Z0-9_\u00C0-\u017F-]+)(?!\w)/g);
  if (!matches) return [];
  return Array.from(
    new Set(matches.map((m) => m.trim().replace(/^#/, '').toLowerCase()).filter((t) => t.length > 1))
  );
}

/**
 * Extract all unique hashtags and counts across all files
 */
export function extractAllTags(files) {
  const tagCounts = {};
  for (const file of Object.values(files || {})) {
    const tags = extractHashtags(file.content || '');
    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get all descendant collection IDs for scoping
 */
export function getDescendantCollectionIds(targetId, collections) {
  if (!targetId) return [];
  const target = findCollectionInTree(targetId, collections);
  if (!target) return [targetId];

  function collect(node) {
    let ids = [node.id];
    for (const child of node.children || []) {
      ids = ids.concat(collect(child));
    }
    return ids;
  }
  return collect(target);
}

/**
 * Score a file against tokenized query with weighted fields & match origin
 */
function scoreFileAdvanced(file, queryTokens, rawQuery, breadcrumb) {
  const qNorm = normalise(rawQuery);
  const nameNorm = normalise(file.name.replace(/\.md$/, ''));
  const titleNorm = normalise(file.youtubeTitle || '');
  const contentNorm = normalise(file.content || '');
  const breadcrumbNorm = normalise(breadcrumb || '');
  const tags = extractHashtags(file.content || '');

  const nameWords = tokenize(nameNorm);
  const titleWords = tokenize(titleNorm);
  const contentWords = tokenize(contentNorm);
  const breadcrumbWords = tokenize(breadcrumbNorm);

  let score = 0;
  let matchType = null; // 'title' | 'video_title' | 'heading' | 'tag' | 'content' | 'folder'
  let matchedHeading = null;

  // 1. Exact full phrase matches
  if (rawQuery.length >= 2) {
    if (nameNorm === qNorm) {
      score += 150;
      matchType = matchType || 'title';
    } else if (nameNorm.includes(qNorm)) {
      score += 100;
      matchType = matchType || 'title';
    }

    if (titleNorm && titleNorm.includes(qNorm)) {
      score += 85;
      matchType = matchType || 'video_title';
    }
  }

  // 2. Check headings in markdown
  const headingMatches = (file.content || '').match(/^#{1,4}\s+(.+)$/gm) || [];
  for (const h of headingMatches) {
    const hClean = h.replace(/^#{1,4}\s+/, '').trim();
    if (normalise(hClean).includes(qNorm)) {
      score += 65;
      matchType = matchType || 'heading';
      matchedHeading = hClean;
      break;
    }
  }

  // 3. Tag matches
  for (const tag of tags) {
    if (qNorm.replace(/^#/, '') === tag || tag.includes(qNorm.replace(/^#/, ''))) {
      score += 55;
      matchType = matchType || 'tag';
    }
  }

  // 4. Token-by-token evaluation across fields
  let matchedTokensCount = 0;
  for (const token of queryTokens) {
    let tokenMatched = false;

    // Title token
    const nameMatch = matchTokenInWords(token, nameWords);
    if (nameMatch.matched) {
      score += nameMatch.exact ? 30 : 20;
      tokenMatched = true;
      matchType = matchType || 'title';
    }

    // Video Title token
    const videoMatch = matchTokenInWords(token, titleWords);
    if (videoMatch.matched) {
      score += videoMatch.exact ? 25 : 15;
      tokenMatched = true;
      matchType = matchType || 'video_title';
    }

    // Content word match
    const contentMatch = matchTokenInWords(token, contentWords);
    if (contentMatch.matched) {
      score += contentMatch.exact ? 15 : 8;
      tokenMatched = true;
      matchType = matchType || 'content';
    }

    // Folder breadcrumb token
    const bcMatch = matchTokenInWords(token, breadcrumbWords);
    if (bcMatch.matched) {
      score += bcMatch.exact ? 12 : 6;
      tokenMatched = true;
      matchType = matchType || 'folder';
    }

    if (tokenMatched) matchedTokensCount++;
  }

  // Bonus when all tokens match
  if (queryTokens.length > 1 && matchedTokensCount === queryTokens.length) {
    score += 40;
  }

  // Only consider a match if at least one token matched
  if (matchedTokensCount === 0 && score === 0) return null;

  return {
    score,
    matchType: matchType || 'content',
    matchedHeading,
    snippet: extractSnippet(file.content, queryTokens),
  };
}

/**
 * Search collections / folders
 * @returns {Array<{ type: 'folder', collection, breadcrumb, score, fileCount }>}
 */
export function searchCollections(query, collections) {
  const q = (query || '').trim();
  if (!q) return [];
  const tokens = tokenize(q);
  if (tokens.length === 0) return [];

  const results = [];

  function walk(node, parentPath) {
    const currentBreadcrumb = parentPath ? `${parentPath} / ${node.name}` : node.name;
    const nameNorm = normalise(node.name);
    const qNorm = normalise(q);
    const words = tokenize(nameNorm);

    let score = 0;
    if (nameNorm === qNorm) {
      score += 120;
    } else if (nameNorm.includes(qNorm)) {
      score += 80;
    } else {
      for (const token of tokens) {
        const m = matchTokenInWords(token, words);
        if (m.matched) score += m.exact ? 25 : 15;
      }
    }

    if (score > 0) {
      results.push({
        type: 'folder',
        collection: node,
        breadcrumb: parentPath,
        score,
        fileCount: (node.fileIds || []).length,
      });
    }

    for (const child of node.children || []) {
      walk(child, currentBreadcrumb);
    }
  }

  for (const root of collections || []) {
    walk(root, '');
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Advanced multi-criteria search across all files
 *
 * @param {string} query
 * @param {Record<string, MarkdownFile>} files
 * @param {Collection[]} collections
 * @param {object} options
 * @param {boolean} [options.hasVideoOnly=false]
 * @param {string|null} [options.collectionId=null]
 * @param {string|null} [options.tag=null]
 * @param {'relevance'|'recent'} [options.sortBy='relevance']
 */
export function searchFiles(query, files, collections, options = {}) {
  const {
    hasVideoOnly = false,
    collectionId = null,
    tag = null,
    sortBy = 'relevance',
  } = options;

  const rawQuery = (query || '').trim();
  const queryTokens = tokenize(rawQuery);
  const isQueryActive = queryTokens.length > 0;

  // Scope to collection if specified
  let allowedColIds = null;
  if (collectionId !== null && collectionId !== undefined) {
    allowedColIds = new Set(getDescendantCollectionIds(collectionId, collections));
  }

  const results = [];

  for (const file of Object.values(files || {})) {
    // 1. Filter: hasVideoOnly
    if (hasVideoOnly && !file.youtubeVideoId) {
      continue;
    }

    // 2. Filter: collection scoping
    if (allowedColIds !== null) {
      if (!allowedColIds.has(file.collectionId)) {
        continue;
      }
    }

    // 3. Filter: tag matching
    if (tag) {
      const noteTags = extractHashtags(file.content || '');
      if (!noteTags.includes(normalise(tag).replace(/^#/, ''))) {
        continue;
      }
    }

    const breadcrumb = buildBreadcrumb(file.collectionId, collections);

    // If query is empty, return matching filtered files
    if (!isQueryActive) {
      results.push({
        type: 'file',
        file,
        breadcrumb,
        score: 1,
        matchType: file.youtubeVideoId ? 'video_title' : 'title',
        snippet: cleanMarkdown(file.content || '').slice(0, 100),
      });
      continue;
    }

    // Advanced score against query
    const match = scoreFileAdvanced(file, queryTokens, rawQuery, breadcrumb);
    if (match && match.score > 0) {
      results.push({
        type: 'file',
        file,
        breadcrumb,
        score: match.score,
        matchType: match.matchType,
        matchedHeading: match.matchedHeading,
        snippet: match.snippet,
      });
    }
  }

  // Sort
  if (sortBy === 'recent') {
    return results.sort((a, b) => {
      const timeA = new Date(a.file.updatedAt || a.file.createdAt || 0).getTime();
      const timeB = new Date(b.file.updatedAt || b.file.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }

  // Default: sort by relevance score descending, then by recent
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const timeA = new Date(a.file.updatedAt || a.file.createdAt || 0).getTime();
    const timeB = new Date(b.file.updatedAt || b.file.createdAt || 0).getTime();
    return timeB - timeA;
  });
}
