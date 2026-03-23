"use client";

import { Map, MapControls } from "@/components/ui/map";

export default function MapPage() {
  return (
    <div className="h-svh w-full">
      <Map center={[14.5058, 46.0569]} zoom={8}>
        <MapControls />
      </Map>
    </div>
  );
}
