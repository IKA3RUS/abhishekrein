function Tags({ tags, color }: { tags: string[]; color?: string }) {
  return (
    <div className="flex gap-1">
      {tags.map((tag) => (
        <div className="typography-text-2">
          <span className="text-neutral-4">#</span>
          <span className="text-violet-7" style={{ color }}>
            {tag}
          </span>
        </div>
      ))}
    </div>
  );
}

export { Tags };
