import {NextRequest, NextResponse} from 'next/server';
import {getServerPocketBase} from '@/lib/pocketbase-server';
import {cookies} from 'next/headers';

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

// PUT/PATCH - Update tag
export async function PUT(
    request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401});
        }

        const pb = getServerPocketBase();
        const cookieStore = await cookies();
        const authCookie = cookieStore.get('pb_auth');

        if (!authCookie) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401});
        }

        const authData = JSON.parse(authCookie.value);
        pb.authStore.save(authData.token, authData.model);

        // Verify ownership before updating
        let existingTag;
        try {
            existingTag = await pb.collection('tags').getOne(id);
        } catch (error: any) {
            if (error?.status === 404) {
                return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
            }
            throw error;
        }

        // Verify the tag belongs to the user
        if (existingTag.user !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const {name, color} = body;

        // Input validation
        const updateData: any = {};
        if (name !== undefined) {
            const sanitizedName = String(name).trim().slice(0, 100);
            if (!sanitizedName) {
                return NextResponse.json({ error: 'Tag name cannot be empty' }, { status: 400 });
            }
            updateData.name = sanitizedName;
        }
        if (color !== undefined) {
            // Validate hex color format
            const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
            if (!hexColorRegex.test(color)) {
                return NextResponse.json({ error: 'Invalid color format' }, { status: 400 });
            }
            updateData.color = color;
        }

        const tag = await pb.collection('tags').update(id, updateData);

        return NextResponse.json(tag);
    } catch (error: any) {
        console.error('PUT /api/tags/[id] error:', error);
        return NextResponse.json(
            {error: error.message || 'Failed to update tag'},
            {status: error?.status || 400}
        );
    }
}

// DELETE - Delete tag
export async function DELETE(
    request: NextRequest,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401});
        }

        const pb = getServerPocketBase();
        const cookieStore = await cookies();
        const authCookie = cookieStore.get('pb_auth');

        if (!authCookie) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401});
        }

        const authData = JSON.parse(authCookie.value);
        pb.authStore.save(authData.token, authData.model);

        // Verify ownership before deleting
        let existingTag;
        try {
            existingTag = await pb.collection('tags').getOne(id);
        } catch (error: any) {
            if (error?.status === 404) {
                return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
            }
            throw error;
        }

        // Verify the tag belongs to the user
        if (existingTag.user !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await pb.collection('tags').delete(id);

        return NextResponse.json({success: true});
    } catch (error: any) {
        console.error('DELETE /api/tags/[id] error:', error);
        return NextResponse.json(
            {error: error.message || 'Failed to delete tag'},
            {status: error?.status || 400}
        );
    }
}
