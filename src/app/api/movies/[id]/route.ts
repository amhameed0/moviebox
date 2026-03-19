import { NextResponse } from 'next/server';
import { updateWatchStatus, deleteMovie } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId, 10);
        const { watch_status } = await req.json();

        if (isNaN(id) || !watch_status) {
            return NextResponse.json({ error: 'Invalid ID or status' }, { status: 400 });
        }

        await updateWatchStatus(id, watch_status);
        return NextResponse.json({ success: true, id, watch_status });
    } catch (error: any) {
        console.error('Update error:', error);
        return NextResponse.json({ error: error.message || 'Failed to update status' }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId, 10);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        await deleteMovie(id);
        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete movie' }, { status: 500 });
    }
}
