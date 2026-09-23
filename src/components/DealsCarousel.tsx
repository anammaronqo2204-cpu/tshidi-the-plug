"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Horizontal carousel for the "more deals" strip on the homepage (combos + pools).
 * Uses native scroll-snap so touch swipe just works for free; arrow buttons and the
 * auto-rotate timer both just scroll the same track by one card's width. Pauses
 * whenever the person is actively touching or hovering it, so it never fights them.
 */
export function DealsCarousel({ slides }: { slides: React.ReactNode[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const scrollByCard = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-carousel-card]");
    const gap = 20;
    const amount = (card?.offsetWidth ?? el.clientWidth) + gap;
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollByCard(1);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <div key={i} data-carousel-card className="w-[82%] flex-none snap-start sm:w-[46%] lg:w-[31%]">
            {slide}
          </div>
        ))}
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous deals"
            onClick={() => scrollByCard(-1)}
            className="absolute left-0 top-1/2 hidden -translate-x-4 -translate-y-1/2 place-items-center rounded-full bg-ink p-3 text-cream shadow-lg transition hover:bg-flame sm:grid"
          >
            <span className="text-lg leading-none">‹</span>
          </button>
          <button
            type="button"
            aria-label="Next deals"
            onClick={() => scrollByCard(1)}
            className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-4 place-items-center rounded-full bg-ink p-3 text-cream shadow-lg transition hover:bg-flame sm:grid"
          >
            <span className="text-lg leading-none">›</span>
          </button>
        </>
      ) : null}
    </div>
  );
}
