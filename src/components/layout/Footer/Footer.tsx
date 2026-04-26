import { Video } from "@/components/primitives/Video";

import { EmailButton } from "@/components/composites/EmailButton";

import AttributionIcon from "@material-symbols/svg-700/sharp/attribution-fill.svg?react";
import TrendingFlatIcon from "@material-symbols/svg-700/sharp/trending_flat-fill.svg?react";

import Logo from "@/assets/common/logos/ika3rus-logo.svg?react";
import LinkedinLogo from "@/assets/common/logos/linkedin-logo.svg?react";
import XLogo from "@/assets/common/logos/x-logo.svg?react";

const X_URL = "https://x.com/ika3rus";
const LINKEDIN_URL = "https://www.linkedin.com/in/ika3rus/";

function Footer() {
  const socials = [
    {
      name: "X",
      url: X_URL,
      logo: XLogo,
    },
    {
      name: "LinkedIn",
      url: LINKEDIN_URL,
      logo: LinkedinLogo,
    },
  ];

  return (
    <footer className="sticky bottom-0 w-full bg-black">
      <div className="relative mx-auto flex max-w-480 flex-col">
        <div className="relative z-1 flex size-full flex-col justify-between gap-20 p-9 sm:p-20 lg:flex-row">
          <div className="flex flex-col gap-20">
            <div className="flex flex-col gap-4">
              <p className="typography-head-3 text-white">abhishek rein</p>
              <div className="w-fit typography-text-2 text-violet-5">
                <p>creates human-centered eye candy</p>
                <p className="flex">
                  <span className="inline-flex grow">with</span>
                  <span>structured thinking</span>
                </p>
                <p className="flex">
                  <span className="inline-flex grow">
                    for multi-dimensional
                  </span>
                  <span>problems.</span>
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <Logo className="size-8 fill-neutral-8" />
              <div className="typography-text-2 text-white">
                <p>handcrafted with a disturbingly</p>
                <p>smooth blend of</p>
                <p>insomnia, nihilism & taste.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-20 sm:gap-12">
            <EmailButton />
            <div className="flex flex-col gap-8">
              {socials.map((social) => (
                <a
                  key={social.name}
                  className="flex w-fit items-center gap-6 typography-text-2 text-white uppercase"
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.logo className="size-5 fill-neutral-6" />
                  {social.name}
                </a>
              ))}
            </div>
            <p className="mt-auto">
              <a
                className="typography-text-2 text-white"
                href="https://nohello.net/en/"
                target="_blank"
                rel="noopener noreferrer"
              >
                reach
                <TrendingFlatIcon className="mx-1 inline size-4 fill-neutral-6" />
                mail/dm.
              </a>
            </p>
          </div>
        </div>
        <Video
          className="absolute inset-0 size-full object-cover"
          src="/videos/common/evolution/evolution.m3u8"
        />
      </div>
      <div className="border-t border-neutral-9">
        <div className="z-1 mx-auto flex w-full max-w-480 items-center gap-2 bg-violet-7 px-9 py-4 sm:px-20 sm:py-2">
          <AttributionIcon className="size-3 fill-violet-5" />
          <a
            className="typography-text-4 font-semibold text-violet-5"
            href="https://www.gnu.org/licenses/copyleft.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Copyleft. 2026.
          </a>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
