'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  Header,
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
  type LinksResponse,
  type PaginationState,
} from '@/components/home';

function HomeContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [links, setLinks] = useState<Link[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    perPage: 12,
    totalItems: 0,
    totalPages: 0,
  });

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isEditLinkDialogOpen, setIsEditLinkDialogOpen] = useState(false);

  // Edit states
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTag, setNewTag] = useState({ name: '', color: '#3b82f6' });
  const [newLink, setNewLink] = useState({
    url: '',
    tags: [] as string[],
  });

  const fetchLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: '12',
      });
      if (search) params.append('search', search);
      if (selectedTag && selectedTag !== 'all') params.append('tagId', selectedTag);

      const response = await fetch(`/api/links?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch links');
      }

      const data: LinksResponse = await response.json();
      setLinks(data.items || []);
      setPagination({
        page: data.page || 1,
        perPage: data.perPage || 12,
        totalItems: data.totalItems || 0,
        totalPages: data.totalPages || 0,
      });
    } catch (error) {
      console.error('Failed to fetch links:', error);
      setLinks([]);
      setPagination({
        page: 1,
        perPage: 12,
        totalItems: 0,
        totalPages: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedTag]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags', {
        credentials: 'include',
      });
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTagFilter = (tagId: string) => {
    setSelectedTag(tagId);
    setPage(1);
  };

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
      fetchLinks();
    } catch (error: any) {
      alert(error.message || 'Failed to create link');
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      alert('Tag name is required');
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
      await fetchTags();
    } catch (error: any) {
      alert(error.message || 'Failed to create tag');
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag) return;
    if (!newTag.name.trim()) {
      alert('Tag name is required');
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
      await fetchTags();
      await fetchLinks();
    } catch (error: any) {
      alert(error.message || 'Failed to update tag');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag? It will be removed from all links.')) {
      return;
    }
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete tag');
      }

      fetchTags();
      fetchLinks();
    } catch (error: any) {
      alert(error.message || 'Failed to delete tag');
    }
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

      fetchLinks();
    } catch (error: any) {
      alert(error.message || 'Failed to update link');
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

  const handleSaveLinkEdit = async () => {
    if (!editingLink) return;
    if (!editingLink.id) {
      alert('Link id is missing. Please reload and try again.');
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
      fetchLinks();
    } catch (error: any) {
      alert(error.message || 'Failed to update link');
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
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];

    handleUpdateLinkTags(linkId, newTags);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <Header user={user} onLogout={handleLogout} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
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
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-muted-foreground">Loading...</div>
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-lg text-muted-foreground">No links found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {search || selectedTag !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first link'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {links.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    onToggleTag={toggleLinkTag}
                    onEdit={handleEditLink}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {links.map((link) => (
                  <LinkListItem
                    key={link.id}
                    link={link}
                    onToggleTag={toggleLinkTag}
                    onEdit={handleEditLink}
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
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
