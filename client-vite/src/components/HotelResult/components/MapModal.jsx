import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function MapModal({ hotels, onClose, navigate }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[95%] h-[90vh] relative shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-white text-gray-600 hover:text-red-600 font-bold text-lg px-3 py-1 rounded-full shadow-md z-50"
        >
          ✕
        </button>

        <MapContainer
          center={[10.7769, 106.7009]}
          zoom={12}
          scrollWheelZoom
          className="h-full w-full z-40"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          />
          {hotels
            .filter((h) => h.latitude && h.longitude)
            .map((h, i) => (
              <Marker key={i} position={[h.latitude, h.longitude]}>
                <Popup>
                  <strong>{h.name}</strong>
                  <br />
                  {h.address}
                  <br />
                  <span
                    className="text-[#0071c2] cursor-pointer"
                    onClick={() => navigate(`/hotel/${h._id}`)}
                  >
                    Xem chi tiết →
                  </span>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}
