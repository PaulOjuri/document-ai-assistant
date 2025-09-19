'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, FileText, FolderOpen, StickyNote, Mic } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { documentService } from '@/lib/supabase/documents';
import { folderService } from '@/lib/supabase/folders';
import { useAuth } from '@/components/auth/auth-provider';
import { getFileTypeIcon, getSafeArtifactColor, formatBytes } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import type { Database } from '@/lib/supabase/database.types';

type Document = Database['public']['Tables']['documents']['Row'];
type Folder = Database['public']['Tables']['folders']['Row'];

interface SearchResult {
  type: 'document' | 'folder' | 'note' | 'audio';
  id: string;
  title: string;
  content?: string;
  snippet?: string;
  metadata?: Record<string, unknown>;
}

interface SearchFilters {
  artifactType?: string;
  priority?: string;
  fileType?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface SearchInterfaceProps {
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  showFilters?: boolean;
}

export function SearchInterface({
  onResultSelect,
  placeholder = "Search documents, notes, and audio...",
  showFilters = true,
}: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const { user } = useAuth();

  const debouncedQuery = useDebounce(query, 300);

  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
    if (!user || !searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const [documents, folders] = await Promise.all([
        documentService.searchDocuments(user.id, searchQuery, {
          artifactType: searchFilters.artifactType,
          priority: searchFilters.priority,
          tags: searchFilters.tags,
        }),
        folderService.searchFolders(user.id, searchQuery),
      ]);

      const searchResults: SearchResult[] = [
        ...documents.map((doc: Document) => ({
          type: 'document' as const,
          id: doc.id,
          title: doc.title,
          content: doc.content,
          snippet: doc.content.substring(0, 150) + '...',
          metadata: {
            fileType: doc.file_type,
            artifactType: doc.artifact_type,
            priority: doc.priority,
            tags: doc.tags,
            fileSize: doc.file_size,
            updatedAt: doc.updated_at,
          },
        })),
        ...folders.map((folder: Folder) => ({
          type: 'folder' as const,
          id: folder.id,
          title: folder.name,
          metadata: {
            safeArtifact: folder.safe_artifact,
            parentId: folder.parent_id,
            updatedAt: folder.updated_at,
          },
        })),
      ];

      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    performSearch(debouncedQuery, filters);
  }, [debouncedQuery, filters, performSearch]);

  const clearFilters = () => {
    setFilters({});
  };

  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'document':
        return getFileTypeIcon(result.metadata?.fileType || 'txt');
      case 'folder':
        return '📁';
      case 'note':
        return '📝';
      case 'audio':
        return '🎵';
      default:
        return '📄';
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-20"
        />

        {showFilters && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            >
              <Filter className="w-4 h-4" />
            </Button>
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => setQuery('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFiltersPanel && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Search Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SAFe Artifact Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Artifact Type</label>
              <select
                value={filters.artifactType || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, artifactType: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm"
              >
                <option value="">All Types</option>
                <option value="Epic">Epic</option>
                <option value="Feature">Feature</option>
                <option value="User Story">User Story</option>
                <option value="Capability">Capability</option>
                <option value="Solution">Solution</option>
                <option value="Theme">Theme</option>
                <option value="Enabler">Enabler</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <select
                value={filters.priority || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm"
              >
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* File Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">File Type</label>
              <select
                value={filters.fileType || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, fileType: e.target.value || undefined }))}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm"
              >
                <option value="">All File Types</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="txt">TXT</option>
                <option value="md">Markdown</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {(query || results.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-40 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center text-[var(--muted-foreground)]">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-0">
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="p-4 hover:bg-[var(--muted)] cursor-pointer border-b border-[var(--border)] last:border-0"
                    onClick={() => onResultSelect?.(result)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl mt-1">
                        {getResultIcon(result)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {highlightText(result.title, query)}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {result.type}
                          </Badge>
                        </div>

                        {result.snippet && (
                          <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                            {highlightText(result.snippet, query)}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center space-x-2 mt-2">
                          {result.metadata?.artifactType && (
                            <span className={`text-xs px-2 py-1 rounded-full ${getSafeArtifactColor(result.metadata.artifactType)}`}>
                              {result.metadata.artifactType}
                            </span>
                          )}
                          {result.metadata?.priority && (
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {result.metadata.priority} Priority
                            </span>
                          )}
                          {result.metadata?.fileSize && (
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {formatBytes(result.metadata.fileSize)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : query ? (
              <div className="p-4 text-center text-[var(--muted-foreground)]">
                No results found for &quot;{query}&quot;
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}