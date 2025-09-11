

"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star, StarHalf, SearchIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { JSX } from "react";

interface Hotel {
  id: string | number;
  name: string;
  location: string;
  rating: number | null;
  img: string;
}

interface ApiResponse {
  places: Hotel[];
}

const fallbackHotels: Hotel[] = [
  {
    id: "1",
    name: "Kwara Hotel",
    location: "9A Ahmadu Bello Way, Ilorin, Kwara, Nigeria",
    rating: 4.2,
    img: "/hotel.png",
  },
  {
    id: "2",
    name: "Royal Orchid Hotel",
    location: "Adewole Street, Ilorin, Kwara, Nigeria",
    rating: 3.5,
    img: "/hotel.png",
  },
  {
    id: "3",
    name: "Sokoto Guest Inn",
    location: "Sokoto Road, Ilorin, Kwara, Nigeria",
    rating: 4.0,
    img: "/hotel.png",
  },
  {
    id: "4",
    name: "Crystal Palace Hotel",
    location: "Fate Road, Ilorin, Kwara, Nigeria",
    rating: 4.5,
    img: "/hotel.png"
  },
];

export default function HotelCard() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-sm text-gray-500">No rating</span>;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars: JSX.Element[] = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
    }
    return stars;
  };

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/hotels");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`HTTP error: ${response.status} - ${errorData.error || "Unknown error"}`);
        }
        const data: ApiResponse = await response.json();
        console.log("API Response:", data);
        const enhancedHotels: Hotel[] = data.places && data.places.length > 0
          ? data.places.map((hotel, index) => ({
              ...hotel,
              rating: hotel.rating || fallbackHotels[index % fallbackHotels.length].rating,
              img: hotel.img || fallbackHotels[index % fallbackHotels.length].img,
            }))
          : fallbackHotels;
        setHotels(enhancedHotels);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching hotels:", error);
        setError(`Failed to load hotels: ${(error as Error).message}. Showing fallback data.`);
        setHotels(fallbackHotels);
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  const filteredHotels = hotels.filter((hotel) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      hotel.name.toLowerCase().includes(q) ||
      hotel.location.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-center md:text-left">List of Hotels in Ilorin </h1>
      <div className="mb-4 flex items-center rounded-md space-x-2 border border-gray-300 max-w-[200px] mx-auto focus:outline-none focus:ring-2 focus:ring-gray-400 ">
      <SearchIcon className="pl-1"/>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search "
          className="w-full  px-3 py-2 text-sm border-none focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <p className="text-gray-600">Loading hotels...</p>
        ) : error ? (
          <>
            <p className="text-red-600">{error}</p>
            {filteredHotels.length === 0 ? (
              <p className="text-gray-600">No hotels found</p>
            ) : (
              filteredHotels.map((hotel) => (
                <Card key={hotel.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                  <CardHeader className="p-0">
                    <div className="relative w-full h-48">
                      <Image
                        src={hotel.img}
                        alt={`${hotel.name} image`}
                        fill
                        className="object-cover rounded-t-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        priority={hotel.id === "1"}
                      />
                    </div>
                    <div className="p-4">
                      <CardTitle className="text-sm font-semibold text-gray-800">{hotel.name}</CardTitle>
                      <CardDescription className="text-sm text-gray-500 mt-1">
                        A beautiful hotel in Ilorin
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 py-2">
                  <p className="text-sm text-gray-600">{hotel.location}</p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center space-x-1">{renderStars(hotel.rating)}</div>
                    <span className="text-sm font-medium text-gray-700">
                      {hotel.rating ? `${hotel.rating}/5` : "No rating"}
                    </span>
                  </CardFooter>
                </Card>
              ))
            )}
          </>
        ) : filteredHotels.length === 0 ? (
          <p className="text-gray-600">No hotels found</p>
        ) : (
          filteredHotels.map((hotel) => (
            <Card key={hotel.id} className="overflow-hidden transition-shadow hover:shadow-lg p-0 m-0">
              <CardHeader className="p-0 m-0 ">
                <div className="relative w-full h-48 ">
                  <Image
                    src={hotel.img}
                    alt={`${hotel.name} image`}
                    fill
                    className="object-cover rounded-t-lg"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    priority={hotel.id === "1"}
                  />
                </div>
                <div className="px-1 m-0">
                  <CardTitle className="text-[15px] font-semibold text-gray-800 px-2 m-0 ">{hotel.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-500 mt-1">
                    A beautiful hotel in Ilorin
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-4 py-0">
              <p className="text-sm text-gray-600">{hotel.location}</p>
              </CardContent>
              <div className="flex items-center justify-between px-4 py-0">
                <div className="flex items-center space-x-1">{renderStars(hotel.rating)}</div>
                <span className="text-sm font-medium text-gray-700">
                  {hotel.rating ? `${hotel.rating}/5` : "No rating"}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}