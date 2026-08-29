"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const CARD_WIDTH = 376;
const CARD_GAP = 32;
const CARD_STEP = CARD_WIDTH + CARD_GAP;
const COPY_SET_COUNT = 3;
const MIDDLE_SET = Math.floor(COPY_SET_COUNT / 2);
const LEADING_GUTTER = 80;

type Story = {
  id: string;
  href: string;
  tone: string;
  type: string;
  title: string;
  copy: string;
  presentation: "stat" | "symbol" | "editorial";
  stat?: string;
};

const stories = [
  {
    id: "water",
    href: "/wakaf/water-pump",
    tone: "water",
    type: "Wakaf water",
    title: "Start where daily life happens.",
    copy: "Why dependable access changes the rhythm of a community.",
    presentation: "stat",
    stat: "100%",
  },
  {
    id: "quran",
    href: "/wakaf/quran",
    tone: "quran",
    type: "Wakaf Quran",
    title: "Make room for learning to continue.",
    copy: "A closer look at giving that keeps knowledge within reach.",
    presentation: "symbol",
  },
  {
    id: "food",
    href: "/wakaf/food-for-orphans",
    tone: "food",
    type: "Shared care",
    title: "A simple act can gather people together.",
    copy: "What a meal can hold beyond the moment it is served.",
    presentation: "editorial",
  },
  {
    id: "korban",
    href: "/korban",
    tone: "korban",
    type: "Korban guide",
    title: "Carry an intention through with care.",
    copy: "A practical path from choosing a service to receiving its report.",
    presentation: "symbol",
  },
  {
    id: "updates",
    href: "#amanah",
    tone: "updates",
    type: "Giving updates",
    title: "Stay close to work happening far away.",
    copy: "How field evidence becomes an update that is useful and clear.",
    presentation: "stat",
    stat: "48h",
  },
] as const satisfies readonly Story[];

const STORIES_PER_SET = stories.length;
const SET_WIDTH = STORIES_PER_SET * CARD_STEP;
const START_INDEX = MIDDLE_SET * STORIES_PER_SET;

function logicalIndex(index: number) {
  return ((index % STORIES_PER_SET) + STORIES_PER_SET) % STORIES_PER_SET;
}

function middleSetIndex(index: number) {
  return START_INDEX + logicalIndex(index);
}

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

export function StoryCarousel() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const currentIndexRef = useRef(START_INDEX);
  const targetIndexRef = useRef(START_INDEX);
  const targetLeftRef = useRef(MIDDLE_SET * SET_WIDTH - LEADING_GUTTER);
  const lockedRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const settleTimerRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [activeStory, setActiveStory] = useState(0);

  const setViewport = useCallback((viewport: HTMLDivElement | null) => {
    viewportRef.current = viewport;
    if (viewport) viewport.scrollLeft = MIDDLE_SET * SET_WIDTH - LEADING_GUTTER;
  }, []);

  const clearSettleTimers = useCallback(() => {
    if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
    settleTimerRef.current = null;
    fallbackTimerRef.current = null;
  }, []);

  const settleAt = useCallback((index: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    clearSettleTimers();
    const rebasedIndex = middleSetIndex(index);
    if (rebasedIndex !== index) {
      viewport.scrollLeft += (rebasedIndex - index) * CARD_STEP;
    }

    currentIndexRef.current = rebasedIndex;
    targetIndexRef.current = rebasedIndex;
    targetLeftRef.current = viewport.scrollLeft;
    setActiveStory(logicalIndex(rebasedIndex));
    lockedRef.current = false;
    setIsLocked(false);
  }, [clearSettleTimers]);

  const settleFromPosition = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const nearestIndex = Math.round(viewport.scrollLeft / CARD_STEP);
    settleAt(nearestIndex);
  }, [settleAt]);

  const move = useCallback((direction: -1 | 1) => {
    const viewport = viewportRef.current;
    if (!viewport || lockedRef.current) return;

    const targetIndex = currentIndexRef.current + direction;
    const targetLeft = viewport.scrollLeft + direction * CARD_STEP;
    targetIndexRef.current = targetIndex;
    targetLeftRef.current = targetLeft;
    lockedRef.current = true;
    setIsLocked(true);

    viewport.scrollTo({
      left: targetLeft,
      behavior: reducedMotionRef.current ? "auto" : "smooth",
    });

    fallbackTimerRef.current = window.setTimeout(
      () => settleAt(targetIndexRef.current),
      reducedMotionRef.current ? 32 : 900,
    );
  }, [settleAt]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = reducedMotion.matches;

    const handleScroll = () => {
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(() => {
        if (lockedRef.current) settleAt(targetIndexRef.current);
        else settleFromPosition();
      }, reducedMotionRef.current ? 0 : 120);
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
      if (event.matches && lockedRef.current) {
        viewport.scrollTo({ left: targetLeftRef.current, behavior: "auto" });
        settleAt(targetIndexRef.current);
      }
    };

    const handleResize = () => {
      if (!lockedRef.current) {
        viewport.scrollLeft = currentIndexRef.current * CARD_STEP - LEADING_GUTTER;
      }
    };

    viewport.addEventListener("scroll", handleScroll, { passive: true });
    reducedMotion.addEventListener("change", handleMotionChange);
    window.addEventListener("resize", handleResize);

    return () => {
      viewport.removeEventListener("scroll", handleScroll);
      reducedMotion.removeEventListener("change", handleMotionChange);
      window.removeEventListener("resize", handleResize);
      clearSettleTimers();
    };
  }, [clearSettleTimers, settleAt, settleFromPosition]);

  return (
    <div
      className="asb-stories asb-story-carousel"
      role="region"
      aria-label="Concept story collection"
      aria-roledescription="carousel"
      data-story-carousel
      data-card-width={CARD_WIDTH}
      data-card-gap={CARD_GAP}
      data-copy-sets={COPY_SET_COUNT}
      data-initial-set={MIDDLE_SET}
    >
      <div className="asb-stories-viewport" ref={setViewport} data-story-viewport>
        <div id="asb-story-rail" className="asb-story-rail" style={{ gap: CARD_GAP }} data-story-rail>
          {Array.from({ length: COPY_SET_COUNT }, (_, setIndex) =>
            stories.map((story, storyIndex) => {
              const isMiddleSet = setIndex === MIDDLE_SET;
              return (
                <Link
                  className={`asb-story-card asb-story-card-${story.tone} asb-story-card-${story.presentation}`}
                  href={story.href}
                  key={`${setIndex}-${story.id}`}
                  prefetch={false}
                  tabIndex={isMiddleSet ? undefined : -1}
                  aria-hidden={isMiddleSet ? undefined : true}
                  aria-label={`${story.type}: ${story.title}`}
                  data-story-card
                  data-story-id={story.id}
                  data-copy-set={setIndex}
                  data-logical-index={storyIndex}
                  style={{ width: CARD_WIDTH, flexBasis: CARD_WIDTH }}
                >
                  <div className="asb-story-mark asb-story-mark-unumbered" data-story-mark>
                    <span className="asb-story-symbol" aria-hidden="true" />
                  </div>
                  {story.presentation === "stat" && <strong className="asb-story-stat">{story.stat}</strong>}
                  <div className="asb-story-editorial-body">
                    <span className="asb-story-type">{story.type}</span>
                    <h3>{story.title}</h3>
                  </div>
                  <div className="asb-story-card-foot">
                    <p>{story.copy}</p>
                    <span className="asb-story-arrow"><Arrow /></span>
                  </div>
                </Link>
              );
            }),
          )}
        </div>
      </div>

      <p
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {stories[activeStory].type}: {stories[activeStory].title}
      </p>

      <div className="asb-story-controls asb-story-controls-field" data-story-controls>
        <button
          type="button"
          aria-label="Previous story"
          aria-controls="asb-story-rail"
          disabled={isLocked}
          data-carousel-direction="previous"
          onClick={() => move(-1)}
        >
          <span aria-hidden="true">←</span>
        </button>
        <button
          type="button"
          aria-label="Next story"
          aria-controls="asb-story-rail"
          disabled={isLocked}
          data-carousel-direction="next"
          onClick={() => move(1)}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
