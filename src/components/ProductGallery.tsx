"use client";

import { useState } from "react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const gallery = images.length ? images : [""];
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-3 sm:grid-cols-[88px_1fr]">
      <div className="no-scrollbar order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col">
        {gallery.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => setActive(index)}
            className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 transition ${
              index === active ? "ring-ink" : "ring-transparent hover:ring-ink/25"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <div className="order-1 overflow-hidden rounded-[2rem] bg-sand sm:order-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gallery[active]}
          alt={name}
          className="aspect-square w-full object-cover transition duration-500"
        />
      </div>
    </div>
  );
}
