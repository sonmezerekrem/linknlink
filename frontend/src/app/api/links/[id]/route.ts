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
    { params }: { params: { id: string } }
) {
    try {
        const aParams = await params;

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

        const body = await request.json();
        const { tags, title, description, notes, is_favorite, archived } = body;

        const updateData: any = {};
        if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (notes !== undefined) updateData.notes = notes;
        if (is_favorite !== undefined) updateData.is_favorite = is_favorite;
        if (archived !== undefined) updateData.archived = archived;

        const link = await pb.collection('links').update(aParams.id, updateData, {
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
    { params }: { params: { id: string } }
) {
    try {
        const aParams = await params;

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

        await pb.collection('links').delete(aParams.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('DELETE /api/links/[id] error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete link' },
            { status: error?.status || 400 }
        );
    }
}
