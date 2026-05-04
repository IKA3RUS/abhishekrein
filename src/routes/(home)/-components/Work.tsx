import { Fragment } from "react/jsx-runtime";

import { Link, useNavigate } from "@tanstack/react-router";

import { noCase } from "change-case";
import { allDetailedWorks, allLinkedWorks } from "content-collections";
import type { DetailedWork, LinkedWork } from "content-collections";

import {
  Button,
  ButtonHotkey,
  ButtonLabel,
  ButtonTrailingIcon,
} from "@/components/primitives/Button";
import { Video } from "@/components/primitives/Video";

import { OrganizationLogo } from "@/components/composites/OrganizationLogo";
import { ReadingMinutesChip } from "@/components/composites/ReadingMinutesChip";

import ArrowOutwardIcon from "@material-symbols/svg-700/sharp/arrow_outward-fill.svg?react";
import Book5Icon from "@material-symbols/svg-700/sharp/book_5-fill.svg?react";
import CloseSmallIcon from "@material-symbols/svg-700/sharp/close_small-fill.svg?react";

function isLinkedWork(work: DetailedWork | LinkedWork): work is LinkedWork {
  return "workUrl" in work;
}

function WorkCard({
  work,
  index,
}: {
  work: DetailedWork | LinkedWork;
  index: number;
}) {
  const navigate = useNavigate();
  const linked = isLinkedWork(work);
  function handleButtonClick() {
    if (linked) {
      window.open(work.workUrl, "_blank", "noopener,noreferrer");
    } else {
      navigate({ to: "/work/$work", params: { work: work._meta.path } });
    }
  }

  return (
    <div
      className="group/card relative col-span-1 flex flex-col"
      style={{ marginTop: index * work.title.length * 5 }}
    >
      {linked ? (
        <a
          href={work.workUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={work.title}
          tabIndex={-1}
          draggable={false}
          className="absolute inset-0 z-0"
        />
      ) : (
        <Link
          to="/work/$work"
          params={{ work: work._meta.path }}
          aria-label={work.title}
          tabIndex={-1}
          draggable={false}
          className="absolute inset-0 z-0"
        />
      )}
      <div className="aspect-square">
        {work.cover.type === "image" && (
          <img
            src={`/images/work/${noCase(work._meta.path)}/${work.cover.filename}`}
            alt={work.title}
            className="size-full object-cover"
          />
        )}
        {work.cover.type === "video" && (
          <Video
            src={`/videos/work/${noCase(work._meta.path)}/${work.cover.filename}`}
            className="size-full object-cover"
            lazy={false}
          />
        )}
      </div>
      <div className="flex flex-col gap-5 border-x border-neutral-3 p-5">
        <div className="mx-auto flex w-full max-w-172.5 items-center justify-start gap-4">
          {work.organizations.map((organization, index) => (
            <Fragment key={organization.name}>
              {index > 0 && (
                <CloseSmallIcon
                  aria-hidden
                  className="fill-neutral-60 size-4"
                />
              )}
              <OrganizationLogo
                organization={organization.name}
                color={work.color}
              />
            </Fragment>
          ))}
        </div>
        <p className="typography-text-1">{work.title}</p>
        <div className="flex gap-1">
          {work.tags.map((tag) => (
            <p key={tag} className="typography-text-2">
              <span className="font-medium text-neutral-4">#</span>
              <span className="text-violet-7">{tag}</span>
            </p>
          ))}
        </div>
        <ReadingMinutesChip minutes={work.readingMinutes} />
      </div>
      <Button
        className="relative z-10 *:data-[slot=label]:group-active/card:text-yellow-4 **:data-[slot=sweep]:group-active/card:translate-y-0 [&_svg]:group-active/card:fill-yellow-4"
        onClick={handleButtonClick}
      >
        <ButtonLabel className="group-active/card:animate-vibrate group-active/card:animation-duration-[0.05s] group-active/card:[--vibrate-amplitude:2px]">
          Read
        </ButtonLabel>
        <ButtonTrailingIcon className="[&>span>*]:group-active/card:animate-marquee-x [&>span>*]:group-active/card:animation-duration-[0.5s]">
          {linked ? <ArrowOutwardIcon /> : <Book5Icon />}
        </ButtonTrailingIcon>
        <ButtonHotkey keys={`Shift+${index + 1}`} />
      </Button>
    </div>
  );
}

export function Work() {
  return (
    <section className="relative sm:-mt-40">
      <div className="mx-auto flex max-w-480 flex-col gap-9 px-9 sm:px-20">
        <h1 className="typography-head-3">work</h1>
        <div className="grid w-full grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-3">
          {allDetailedWorks.map((work, index) => (
            <WorkCard key={work.title} work={work} index={index} />
          ))}
          {allLinkedWorks.map((work, index) => (
            <WorkCard
              key={work.title}
              work={work}
              index={allDetailedWorks.length + index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
