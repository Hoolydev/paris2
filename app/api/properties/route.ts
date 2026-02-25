import { NextRequest, NextResponse } from 'next/server';
import { getProperties, saveProperty, deleteProperty, updateProperty } from '@/lib/properties';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const properties = await getProperties();
        return NextResponse.json(properties);
    } catch (error) {
        console.error('Error fetching properties:', error);
        return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const property = await request.json();

        // Generate a simple ID - actually now handled by DB but we pass it anyway or omit?
        // Our updated saveProperty ignores the passed ID and lets DB generate UUID.
        // So we can just pass the property as is, maybe with a dummy ID if types require it.
        // Property interface requires ID.

        const newPropertyObj = {
            ...property,
            id: Date.now().toString() // Temporary ID, will be replaced by DB UUID
        };

        const savedProperty = await saveProperty(newPropertyObj);

        if (!savedProperty) {
            throw new Error('Failed to save property to database');
        }

        return NextResponse.json(savedProperty, { status: 201 });
    } catch (error) {
        console.error('Error saving property:', error);
        return NextResponse.json(
            {
                error: 'Failed to save property',
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
        }

        const property = await request.json();
        const updatedProperty = await updateProperty(id, property);

        if (!updatedProperty) {
            return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
        }

        return NextResponse.json(updatedProperty);
    } catch (error) {
        console.error('Error updating property:', error);
        return NextResponse.json(
            {
                error: 'Failed to update property',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
        }

        const success = await deleteProperty(id);
        if (!success) {
            return NextResponse.json({ error: 'Failed to delete property or not found' }, { status: 500 }); // or 404
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting property:', error);
        return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
    }
}
