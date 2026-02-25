import { notFound } from 'next/navigation';
import { getPropertyById, getSimilarProperties } from '@/lib/properties';
import PropertyClientView from './PropertyClientView';
import SimilarProperties from '@/components/SimilarProperties';

export const dynamic = 'force-dynamic';

interface PropertyPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function PropertyPage({ params }: PropertyPageProps) {
    const resolvedParams = await params;
    const property = await getPropertyById(resolvedParams.id);

    if (!property) {
        notFound();
    }

    const similarProperties = await getSimilarProperties(property.type, property.location, property.id);

    return (
        <>
            <PropertyClientView property={property} />
            <SimilarProperties properties={similarProperties} />
        </>
    );
}
