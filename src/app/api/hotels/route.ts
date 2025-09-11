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

type GeoapifyResponse = {
  features: Array<{
    properties: { formatted: string };
  }>;
};

type NominatimResponse = {
  display_name: string;
};

// type ApiResponse = {
//   places: Hotel[];
// };

async function reverseGeocode(lat: number, lon: number, apiKey: string): Promise<string> {
  // Try Geoapify
  try {
    const geoResponse = await fetch(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&lang=en&apiKey=${apiKey}`,
      { headers: { 'User-Agent': 'IlorinHotelsApp/1.0' } }
    );
    if (geoResponse.ok) {
      const geoData: GeoapifyResponse = await geoResponse.json();
      return geoData.features[0]?.properties.formatted || `${lat}, ${lon}`;
    } else {
      console.error(`Geoapify not OK for ${lat}, ${lon}: ${geoResponse.status}`);
    }
  } catch (geoError) {
    console.error(`Geoapify failed for ${lat}, ${lon}:`, geoError);
  }

  // Fallback to Nominatim
  try {
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'IlorinHotelsApp/1.0' } }
    );
    if (nominatimResponse.ok) {
      const nominatimData: NominatimResponse = await nominatimResponse.json();
      return nominatimData.display_name || `${lat}, ${lon}`;
    } else {
      console.error(`Nominatim not OK for ${lat}, ${lon}: ${nominatimResponse.status}`);
    }
  } catch (nominatimError) {
    console.error(`Nominatim failed for ${lat}, ${lon}:`, nominatimError);
  }

  // Final fallback: raw coordinates
  return `${lat}, ${lon}`;
}

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

    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      throw new Error('Geoapify API key is missing');
    }

    const data = (await response.json()) as OSMResponse;
    const hotels: Hotel[] = Array.isArray(data.elements)
      ? await Promise.all(
          data.elements.map(async (node) => {
            const location = node.tags['addr:street'] || await reverseGeocode(node.lat, node.lon, apiKey);
            return {
              id: node.id,
              name: node.tags.name || 'Unnamed Hotel',
              location,
              rating: null,
              // img: `/hotels/placeholder${(index % 4) + 1}.png`
            };
          })
        )
      : [];

    console.log('OSM API Response:', data);
    return NextResponse.json({ places: hotels }, { status: 200 });
  } catch (error) {
    console.error('Error fetching OSM hotels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hotels', details: (error as Error).message },
      { status: 500 }
    );
  }
}