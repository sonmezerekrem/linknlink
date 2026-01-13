import { NextRequest, NextResponse } from 'next/server';
import { getServerPocketBase } from '@/lib/pocketbase-server';
import { cookies } from 'next/headers';

// Helper to get authenticated user
async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('pb_auth');

    if (!authCookie) {
        return null;
    }

    const authData = JSON.parse(authCookie.value);
    const pb = getServerPocketBase();
    pb.authStore.save(authData.token, authData.model);
    return authData.model;
}

// PUT/PATCH - Update link
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const pb = getServerPocketBase();
        const cookieStore = await cookies();
        const authCookie = cookieStore.get('pb_auth');

        if (!authCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const authData = JSON.parse(authCookie.value);
        pb.authStore.save(authData.token, authData.model);

        // Verify ownership before updating
        let existingLink;
        try {
            existingLink = await pb.collection('links').getOne(id);
        } catch (error: any) {
            if (error?.status === 404) {
                return NextResponse.json({ error: 'Link not found' }, { status: 404 });
            }
            throw error;
        }

        // Verify the link belongs to the user
        if (existingLink.user !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { tags, title, description, notes, is_favorite, archived } = body;

        // Input validation and sanitization
        const updateData: any = {};
        if (tags !== undefined) {
            if (!Array.isArray(tags)) {
                return NextResponse.json({ error: 'Tags must be an array' }, { status: 400 });
            }
            updateData.tags = tags;
        }
        if (title !== undefined) {
            const sanitizedTitle = String(title).trim().slice(0, 500);
            updateData.title = sanitizedTitle;
        }
        if (description !== undefined) {
            const sanitizedDescription = String(description).trim().slice(0, 2000);
            updateData.description = sanitizedDescription;
        }
        if (notes !== undefined) {
            const sanitizedNotes = String(notes).trim().slice(0, 5000);
            updateData.notes = sanitizedNotes;
        }
        if (is_favorite !== undefined) {
            updateData.is_favorite = Boolean(is_favorite);
        }
        if (archived !== undefined) {
            updateData.archived = Boolean(archived);
        }

        const link = await pb.collection('links').update(id, updateData, {
            expand: 'tags',
        });

        return NextResponse.json(link);
    } catch (error: any) {
        console.error('PUT /api/links/[id] error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update link' },
            { status: error?.status || 400 }
        );
    }
}

// DELETE - Delete link
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const pb = getServerPocketBase();
        const cookieStore = await cookies();
        const authCookie = cookieStore.get('pb_auth');

        if (!authCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const authData = JSON.parse(authCookie.value);
        pb.authStore.save(authData.token, authData.model);

        // Verify ownership before deleting
        let existingLink;
        try {
            existingLink = await pb.collection('links').getOne(id);
        } catch (error: any) {
            if (error?.status === 404) {
                return NextResponse.json({ error: 'Link not found' }, { status: 404 });
            }
            throw error;
        }

        // Verify the link belongs to the user
        if (existingLink.user !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await pb.collection('links').delete(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('DELETE /api/links/[id] error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete link' },
            { status: error?.status || 400 }
        );
    }
}
