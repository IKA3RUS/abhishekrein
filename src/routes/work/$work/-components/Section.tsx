export function Section({
  id,
  children,
}: {
  id: string;
  children?: React.ReactNode;
}) {
  return (
    <section data-section={id} id={id} className="relative">
      <span className="block pr-2 typography-head-6 text-neutral-4 xl:absolute xl:top-0 xl:left-0">
        {id}
      </span>
      {children}
    </section>
  );
}
