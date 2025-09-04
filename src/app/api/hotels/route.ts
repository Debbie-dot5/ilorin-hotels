import { NextResponse } from 'next/server';

type Hotel = {
  id: number | string;
  name: string;
  location: string;
  rating: number | null;
  img?: string;
};

type OSMNode = {
  id: number;
  tags: { name?: string; 'addr:street'?: string };
  lat: number;
  lon: number;
};

type OSMResponse = {
  elements: OSMNode[];
};

export async function GET() {
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain; charset=UTF-8',
      },
      body: '[out:json];(node[amenity=hotel](8.3,4.4,8.7,4.8);node[tourism=hotel](8.3,4.4,8.7,4.8););out body;'
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json(
        { error: `OSM API error`, details: errorText || `status ${response.status}` },
        { status: 502 }
      );
    }

    const data = (await response.json()) as OSMResponse;
    const hotels: Hotel[] = Array.isArray(data.elements)
      ? data.elements.map((node) => ({
          id: node.id,
          img: "/hotel.png", //placeholder
          name: node.tags.name || 'Unnamed Hotel',
          location: node.tags['addr:street'] || `${node.lat}, ${node.lon}`,
          rating: null
        }))
      : [];

    return NextResponse.json({ places: hotels }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch hotels', details: (error as Error).message },
      { status: 500 }
    );
  }
}