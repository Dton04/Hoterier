import React from "react";

export default function GoogleMapEmbed({ address }) {
  return (
    <div className="w-full rounded-xl overflow-hidden shadow-md border border-gray-200 h-[280px]">
      <iframe
        title="Hotel Location"
        src={`https://maps.google.com/maps?q=${encodeURIComponent(
          address
        )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
      ></iframe>
    </div>
  );
}
