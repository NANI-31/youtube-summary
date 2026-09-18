import { useMemo, useState } from 'react';
import { searchFiles } from '../utils/search.js';

export function useSearch(files, collections) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    return searchFiles(query, files, collections);
  }, [query, files, collections]);

  return { query, setQuery, results };
}
