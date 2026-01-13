'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LinkCard,
  LinkListItem,
  AddLinkDialog,
  EditLinkDialog,
  ManageTagsDialog,
  SearchAndFilters,
  LinksPagination,
  ViewModeToggle,
  decode,
  type Link,
  type Tag,
  type PaginationState,
} from '@/components/home';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLinksContext } from './LinksProvider';

const DEBOUNCE_DELAY = 500;

interface HomeClientProps {
  initialPagination: PaginationState;
  initialSearchParams: {
    page?: string;
    search?: string;
    tagId?: string;
  };
}

export function HomeClient({ initialPagination, initialSearchParams }: HomeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { links, tags, refreshLinks, refreshTags } = useLinksContext();

  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState(initialSearchParams.search || '');
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearchParams.search || '');
  const [selectedTag, setSelectedTag] = useState<string>(initialSearchParams.tagId || 'all');
  const [page, setPage] = useState(parseInt(initialSearchParams.page || '1', 10));
  const [pagination, setPagination] = useState<PaginationState>(initialPagination);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isEditLinkDialogOpen, setIsEditLinkDialogOpen] = useState(false);

  // Alert dialog states
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({ open: false, title: '', message: '' });

  // Confirmation dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  // Edit states
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTag, setNewTag] = useState({ name: '', color: '#3b82f6' });
  const [newLink, setNewLink] = useState({
    url: '',
    tags: [] as string[],
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [search]);

  // Update URL with search params
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedTag && selectedTag !== 'all') params.set('tagId', selectedTag);

    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.replace(newUrl, { scroll: false });
  }, [page, debouncedSearch, selectedTag, router]);

  const fetchLinksClient = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: '12',
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedTag && selectedTag !== 'all') params.append('tagId', selectedTag);

      const response = await fetch(`/api/links?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch links');
      }

      const data = await response.json();
      refreshLinks();
      setPagination({
        page: data.page || 1,
        perPage: data.perPage || 12,
        totalItems: data.totalItems || 0,
        totalPages: data.totalPages || 0,
      });
    } catch (error) {
      console.error('Failed to fetch links:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, selectedTag, refreshLinks]);

  useEffect(() => {
    fetchLinksClient();
  }, [fetchLinksClient]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleTagFilter = useCallback((tagId: string) => {
    setSelectedTag(tagId);
    setPage(1);
  }, []);

  const handleCreateLink = async () => {
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newLink),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create link');
      }

      setIsDialogOpen(false);
      setNewLink({ url: '', tags: [] });
      fetchLinksClient();
    } catch (error: any) {
      setAlertDialog({
        open: true,
        title: 'Error',
        message: error.message || 'Failed to create link',
      });
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      setAlertDialog({
        open: true,
        title: 'Validation Error',
        message: 'Tag name is required',
      });
      return;
    }
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newTag),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tag');
      }

      setNewTag({ name: '', color: '#3b82f6' });
      await refreshTags();
    } catch (error: any) {
      setAlertDialog({
        open: true,
        title: 'Error',
        message: error.message || 'Failed to create tag',
      });
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag) return;
    if (!newTag.name.trim()) {
      setAlertDialog({
        open: true,
        title: 'Validation Error',
        message: 'Tag name is required',
      });
      return;
    }
    try {
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newTag),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update tag');
      }

      setEditingTag(null);
      setNewTag({ name: '', color: '#3b82f6' });
      await refreshTags();
      await fetchLinksClient();
    } catch (error: any) {
      setAlertDialog({
        open: true,
        title: 'Error',
        message: error.message || 'Failed to update tag',
      });
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Tag',
      message: 'Are you sure you want to delete this tag? It will be removed from all links.',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/tags/${tagId}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete tag');
          }

          refreshTags();
          fetchLinksClient();
          setConfirmDialog({ open: false, title: '', message: '', onConfirm: () => {} });
        } catch (error: any) {
          setConfirmDialog({ open: false, title: '', message: '', onConfirm: () => {} });
          setAlertDialog({
            open: true,
            title: 'Error',
            message: error.message || 'Failed to delete tag',
          });
        }
      },
    });
  };

  const handleUpdateLinkTags = async (linkId: string | undefined, newTags: string[]) => {
    if (!linkId) {
      console.error('Missing link id when updating tags');
      return;
    }
    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ tags: newTags }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update link');
      }

      fetchLinksClient();
    } catch (error: any) {
      setAlertDialog({
        open: true,
        title: 'Error',
        message: error.message || 'Failed to update link',
      });
    }
  };

  const handleEditLink = (link: Link) => {
    setEditingLink({
      ...link,
      title: decode(link.title),
      description: decode(link.description),
    });
    setIsEditLinkDialogOpen(true);
  };

  const handleDeleteLink = async (link: Link) => {
    if (!link.id) {
      setAlertDialog({
        open: true,
        title: 'Error',
        message: 'Link id is missing. Please reload and try again.',
      });
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'Delete Link',
      message: 'Are you sure you want to delete this link?',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/links/${link.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete link');
          }

          fetchLinksClient();
          setConfirmDialog({ open: false, title: '', message: '', onConfirm: () => {} });
        } catch (error: any) {
          setConfirmDialog({ open: false, title: '', message: '', onConfirm: () => {} });
          setAlertDialog({
            open: true,
            title: 'Error',
            message: error.message || 'Failed to delete link',
          });
        }
      },
    });
  };

  const handleSaveLinkEdit = async () => {
    if (!editingLink) return;
    if (!editingLink.id) {
      setAlertDialog({
        open: true,
        title: 'Error',
        message: 'Link id is missing. Please reload and try again.',
      });
      return;
    }
    try {
      const response = await fetch(`/api/links/${editingLink.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tags: editingLink.tags || [],
          title: editingLink.title,
          description: editingLink.description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update link');
      }

      setIsEditLinkDialogOpen(false);
      setEditingLink(null);
      fetchLinksClient();
    } catch (error: any) {
      setAlertDialog({
        open: true,
        title: 'Error',
        message: error.message || 'Failed to update link',
      });
    }
  };

  const toggleLinkTag = (linkId: string | undefined, tagId: string) => {
    if (!linkId) {
      console.error('Missing link id when toggling tag');
      return;
    }
    const link = links.find((l) => l.id === linkId);
    if (!link) return;

    const currentTags = link.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((t: string) => t !== tagId)
      : [...currentTags, tagId];

    handleUpdateLinkTags(linkId, newTags);
  };

  const hasNoResults = useMemo(() => links.length === 0, [links.length]);
  const isFiltered = useMemo(
    () => search !== '' || selectedTag !== 'all',
    [search, selectedTag]
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <SearchAndFilters
            search={search}
            selectedTag={selectedTag}
            tags={tags}
            onSearchChange={handleSearch}
            onTagFilterChange={handleTagFilter}
          />
          <ManageTagsDialog
            isOpen={isTagDialogOpen}
            onOpenChange={setIsTagDialogOpen}
            tags={tags}
            editingTag={editingTag}
            newTag={newTag}
            onEditingTagChange={setEditingTag}
            onNewTagChange={setNewTag}
            onCreateTag={handleCreateTag}
            onUpdateTag={handleUpdateTag}
            onDeleteTag={handleDeleteTag}
          />
        </div>
        <div className="flex items-center gap-2">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          <AddLinkDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            tags={tags}
            newLink={newLink}
            onNewLinkChange={setNewLink}
            onSubmit={handleCreateLink}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      ) : hasNoResults ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-center max-w-md">
            <p className="text-lg font-semibold mb-2">No links found</p>
            <p className="text-sm text-muted-foreground">
              {isFiltered
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Get started by adding your first link using the "Add Link" button above.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {links.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  onToggleTag={toggleLinkTag}
                  onEdit={handleEditLink}
                  onDelete={handleDeleteLink}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <LinkListItem
                  key={link.id}
                  link={link}
                  onToggleTag={toggleLinkTag}
                  onEdit={handleEditLink}
                  onDelete={handleDeleteLink}
                />
              ))}
            </div>
          )}

          <EditLinkDialog
            isOpen={isEditLinkDialogOpen}
            onOpenChange={setIsEditLinkDialogOpen}
            tags={tags}
            editingLink={editingLink}
            onEditingLinkChange={setEditingLink}
            onSubmit={handleSaveLinkEdit}
          />

          <LinksPagination
            pagination={pagination}
            currentPage={page}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Alert Dialog */}
      <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog({ ...alertDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertDialog.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertDialog({ open: false, title: '', message: '' })}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialog({ open: false, title: '', message: '', onConfirm: () => {} })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmDialog.onConfirm();
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
