'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Label } from '@/components/ui/label';
import { Grid, List, Plus, ExternalLink, Tag as TagIcon, X, Edit2, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { RecordModel } from 'pocketbase';

type Link = RecordModel & {
  url: string;
  title?: string;
  description?: string;
  og_image?: string;
  og_site_name?: string;
  favicon?: string;
  tags?: string[];
  expand?: {
    tags?: Tag[];
  };
};

type Tag = RecordModel & {
  name: string;
  color?: string;
};

type LinksResponse = {
  items: Link[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

function HomeContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [links, setLinks] = useState<Link[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  // use "all" sentinel to avoid empty-string Select value issues
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 12,
    totalItems: 0,
    totalPages: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isEditLinkDialogOpen, setIsEditLinkDialogOpen] = useState(false);
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

  const getTagColor = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    return tag?.color || '#3b82f6';
  };

  const getTagName = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    return tag?.name || 'Unknown';
  };

  const decode = (value?: string) => {
    if (!value) return value;
    return value
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .trim();
  };

  const getLinkTitle = (link: Link) => {
    const decoded = decode(link.title);
    if (decoded) return decoded;
    try {
      return new URL(link.url).hostname;
    } catch {
      return link.url;
    }
  };

  const getLinkDescription = (link: Link) => {
    const decoded = decode(link.description);
    if (decoded) return decoded;
    try {
      return new URL(link.url).hostname;
    } catch {
      return link.url;
    }
  };

  const getLinkImage = (link: Link) => {
    return link.og_image || link.favicon || '';
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            LinknLink
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {user?.email}
            </span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search links..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedTag} onValueChange={handleTagFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <TagIcon className="mr-2 h-4 w-4" />
                  Manage Tags
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Manage Tags</DialogTitle>
                  <DialogDescription>
                    Create, edit, or delete tags for organizing your links
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="tag-name">Tag Name *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tag-name"
                        placeholder="Enter tag name"
                        value={editingTag ? editingTag.name : newTag.name}
                        onChange={(e) =>
                          editingTag
                            ? setEditingTag({ ...editingTag, name: e.target.value })
                            : setNewTag({ ...newTag, name: e.target.value })
                        }
                        className="flex-1"
                      />
                      <Input
                        type="color"
                        value={editingTag ? editingTag.color || '#3b82f6' : newTag.color}
                        onChange={(e) =>
                          editingTag
                            ? setEditingTag({ ...editingTag, color: e.target.value })
                            : setNewTag({ ...newTag, color: e.target.value })
                        }
                        className="w-20"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {editingTag ? (
                      <>
                        <Button onClick={handleUpdateTag} className="flex-1">
                          Update Tag
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingTag(null);
                            setNewTag({ name: '', color: '#3b82f6' });
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleCreateTag} className="flex-1">
                        Create Tag
                      </Button>
                    )}
                  </div>
                  <div className="border-t pt-4">
                    <Label className="mb-3 block">Existing Tags</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {tags.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No tags yet. Create one above!</p>
                      ) : (
                        tags.map((tag) => (
                          <div
                            key={tag.id}
                            className="flex items-center justify-between p-2 rounded-md border hover:bg-accent"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: tag.color || '#3b82f6' }}
                              />
                              <span>{tag.name}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingTag(tag);
                                  setNewTag({ name: tag.name, color: tag.color || '#3b82f6' });
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTag(tag.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Link</DialogTitle>
                  <DialogDescription>
                    Paste a URL. We&apos;ll pull title and description automatically.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">URL *</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com"
                      value={newLink.url}
                      onChange={(e) =>
                        setNewLink({ ...newLink, url: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                      {tags.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No tags available. Create tags in "Manage Tags" first.
                        </p>
                      ) : (
                        tags.map((tag) => (
                          <div key={tag.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`tag-${tag.id}`}
                              checked={newLink.tags.includes(tag.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewLink({
                                    ...newLink,
                                    tags: [...newLink.tags, tag.id],
                                  });
                                } else {
                                  setNewLink({
                                    ...newLink,
                                    tags: newLink.tags.filter((t) => t !== tag.id),
                                  });
                                }
                              }}
                            />
                            <Label
                              htmlFor={`tag-${tag.id}`}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: tag.color || '#3b82f6' }}
                              />
                              {tag.name}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateLink}>Add Link</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
              {search || selectedTag
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first link'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {links.map((link) => {
                  const imageUrl = getLinkImage(link);
                  return (
                    <Card key={link.id} className="hover:shadow-lg transition-shadow overflow-hidden pt-0">
                      {imageUrl ? (
                        <div className="h-48 w-full overflow-hidden bg-muted">
                          <img
                            src={imageUrl}
                            alt={getLinkTitle(link)}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="h-40 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="line-clamp-2">
                            {getLinkTitle(link)}
                          </CardTitle>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                        {link.og_site_name && (
                          <CardDescription>{link.og_site_name}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {link.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {getLinkDescription(link)}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          {link.expand?.tags && link.expand.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {link.expand.tags.map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant="outline"
                                  style={{ borderColor: tag.color || '#3b82f6' }}
                                  className="cursor-pointer hover:opacity-80"
                                  onClick={() => toggleLinkTag(link.id, tag.id)}
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditLink(link)}
                            className="ml-auto"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {links.map((link) => {
                  const imageUrl = getLinkImage(link);
                  return (
                    <Card key={link.id} className="hover:shadow-lg transition-shadow py-0">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="h-24 w-32 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={getLinkTitle(link)}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              <CardTitle className="line-clamp-1">
                                {getLinkTitle(link)}
                              </CardTitle>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground flex-shrink-0"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                            {link.og_site_name && (
                              <CardDescription className="mb-2">
                                {link.og_site_name}
                              </CardDescription>
                            )}
                            {link.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {getLinkDescription(link)}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              {link.expand?.tags && link.expand.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {link.expand.tags.map((tag) => (
                                    <Badge
                                      key={tag.id}
                                      variant="outline"
                                      style={{ borderColor: tag.color || '#3b82f6' }}
                                      className="cursor-pointer hover:opacity-80"
                                      onClick={() => toggleLinkTag(link.id, tag.id)}
                                    >
                                      {tag.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditLink(link)}
                                className="ml-auto"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Edit Link Dialog */}
            <Dialog open={isEditLinkDialogOpen} onOpenChange={setIsEditLinkDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Link</DialogTitle>
                  <DialogDescription>
                    Update link details and tags
                  </DialogDescription>
                </DialogHeader>
                {editingLink && (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-title">Title</Label>
                      <Input
                        id="edit-title"
                        value={editingLink.title || ''}
                        onChange={(e) =>
                          setEditingLink({ ...editingLink, title: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Input
                        id="edit-description"
                        value={editingLink.description || ''}
                        onChange={(e) =>
                          setEditingLink({ ...editingLink, description: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                        {tags.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No tags available. Create tags in "Manage Tags" first.
                          </p>
                        ) : (
                          tags.map((tag) => (
                            <div key={tag.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-tag-${tag.id}`}
                                checked={(editingLink.tags || []).includes(tag.id)}
                                onCheckedChange={(checked) => {
                                  const currentTags = editingLink.tags || [];
                                  if (checked) {
                                    setEditingLink({
                                      ...editingLink,
                                      tags: [...currentTags, tag.id],
                                    });
                                  } else {
                                    setEditingLink({
                                      ...editingLink,
                                      tags: currentTags.filter((t) => t !== tag.id),
                                    });
                                  }
                                }}
                              />
                              <Label
                                htmlFor={`edit-tag-${tag.id}`}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: tag.color || '#3b82f6' }}
                                />
                                {tag.name}
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditLinkDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveLinkEdit}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {pagination.totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 1) setPage(page - 1);
                        }}
                        className={
                          page === 1 ? 'pointer-events-none opacity-50' : ''
                        }
                      />
                    </PaginationItem>
                    {(() => {
                      const pages: (number | 'ellipsis')[] = [];
                      const totalPages = pagination.totalPages;
                      const currentPage = page;

                      if (totalPages <= 7) {
                        // Show all pages if 7 or fewer
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // Always show first page
                        pages.push(1);

                        if (currentPage <= 3) {
                          // Near the start
                          for (let i = 2; i <= 4; i++) {
                            pages.push(i);
                          }
                          pages.push('ellipsis');
                          pages.push(totalPages);
                        } else if (currentPage >= totalPages - 2) {
                          // Near the end
                          pages.push('ellipsis');
                          for (let i = totalPages - 3; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // In the middle
                          pages.push('ellipsis');
                          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                            pages.push(i);
                          }
                          pages.push('ellipsis');
                          pages.push(totalPages);
                        }
                      }

                      return pages.map((item, index) => {
                        if (item === 'ellipsis') {
                          return (
                            <PaginationItem key={`ellipsis-${index}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return (
                          <PaginationItem key={item}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(item);
                              }}
                              isActive={item === page}
                            >
                              {item}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      });
                    })()}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < pagination.totalPages) setPage(page + 1);
                        }}
                        className={
                          page === pagination.totalPages
                            ? 'pointer-events-none opacity-50'
                            : ''
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
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
