import { NextRequest, NextResponse } from 'next/server';
import { searchProperties } from '@/lib/properties';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const filters = {
            type: searchParams.get('type') || undefined,
            neighborhood: searchParams.get('neighborhood') || undefined,
            bedrooms: searchParams.get('bedrooms') ? parseInt(searchParams.get('bedrooms')!, 10) : undefined,
            minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
            maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
            query: searchParams.get('query') || undefined,
        };

        const properties = await searchProperties(filters);

        return NextResponse.json(properties);
    } catch (error) {
        console.error('Error searching properties:', error);
        return NextResponse.json({ error: 'Failed to search properties' }, { status: 500 });
    }
}
