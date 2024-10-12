import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const location = searchParams.get('location');
  const radius = searchParams.get('radius');
  const type = searchParams.get('type') || 'restaurant'; // Default to 'restaurant' if type not provided
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  try {
    let coordinates = location;

    // Check if the location is already in lat/lng format (simple regex)
    const latLngRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    if (!latLngRegex.test(location as string)) {
      // Fetch coordinates from Google Geocoding API
      const geocodeResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: location,
          key: apiKey,
        },
      });

      const geocodeData = geocodeResponse.data;
      if (geocodeData.results.length === 0) {
        return NextResponse.json({ error: "Location not found." }, { status: 400 });
      }

      const { lat, lng } = geocodeData.results[0].geometry.location;
      coordinates = `${lat},${lng}`;
    }

    // Now use the coordinates with the Places API to fetch only restaurants
    const placesResponse = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: coordinates,
        radius,
        type, // Use the dynamically set type
        key: apiKey,
      },
    });

    return NextResponse.json(placesResponse.data.results);

    console.log('API Type:', type); // In route.ts

  } catch (error) {
    console.error("Error in fetchRestaurants:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
