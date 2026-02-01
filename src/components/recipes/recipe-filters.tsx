"use client";

import { ChevronDown, Filter, FolderOpen, Plus, Search, Tag, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CreateCollectionDialog } from "@/components/collections/create-collection-dialog";
import { AuthorAvatar } from "@/components/recipes/author-avatar";
import { CreateTagDialog } from "@/components/tags/create-tag-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
} from "@/components/ui/platform-badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type {
  CreatorOption,
  RecencyOption,
  RecipeFilters,
} from "@/lib/recipe-filters";
import { trackEvent } from "@/lib/tracking";
import { cn } from "@/lib/utils";
import type { Collection } from "@/types/collection";
import type { PlanTier } from "@/types/subscription";
import type { Tag as TagType } from "@/types/tag";

interface FilterOptions {
  platforms: string[];
  creators: CreatorOption[];
  cuisines: string[];
}

interface RecipeFiltersProps {
  filters: RecipeFilters;
  onChange: (filters: RecipeFilters) => void;
  options: FilterOptions;
  activeCount: number;
  tags?: TagType[];
  planTier?: PlanTier;
  onAuthorAvatarRefresh?: (authorId: string, newAvatarUrl: string) => void;
}

interface RecipeFiltersMobileProps extends RecipeFiltersProps {
  collections?: Collection[];
  selectedCollectionId?: string | null;
  onSelectCollection?: (collectionId: string | null) => void;
  totalRecipeCount?: number;
}

const platformIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  tiktok: TikTokIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
};

const platformLabels: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  other: "Other",
};

const difficultyOptions = ["Easy", "Medium", "Hard"];

const recencyOptions: { value: RecencyOption; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
  { value: "older", label: "Older" },
];

function FilterChip({
  label,
  count,
  isOpen,
  onClick,
}: {
  label: string;
  count: number;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors cursor-pointer",
        count > 0
          ? "border-primary bg-primary/10 text-primary"
          : "border-input bg-white hover:bg-accent dark:bg-input/30",
        isOpen && "ring-ring ring-2",
      )}
    >
      {label}
      {count > 0 && (
        <span className="bg-primary text-primary-foreground ml-0.5 flex size-5 items-center justify-center rounded-full text-xs">
          {count}
        </span>
      )}
      <ChevronDown
        className={cn("size-4 transition-transform", isOpen && "rotate-180")}
      />
    </button>
  );
}

function MultiSelectFilter({
  options,
  selected,
  onToggle,
  renderOption,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  renderOption?: (value: string) => React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option}
          className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md p-1.5"
        >
          <Checkbox
            checked={selected.includes(option)}
            onCheckedChange={() => onToggle(option)}
          />
          {renderOption ? renderOption(option) : <span className="text-sm">{option}</span>}
        </label>
      ))}
    </div>
  );
}

const CREATORS_INITIAL_LIMIT = 10;

function CreatorFilterList({
  creators,
  selected,
  onToggle,
  onAuthorAvatarRefresh,
}: {
  creators: CreatorOption[];
  selected: string[];
  onToggle: (username: string) => void;
  onAuthorAvatarRefresh?: (authorId: string, newAvatarUrl: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredCreators = useMemo(() => {
    if (!search) return creators;
    const term = search.toLowerCase();
    return creators.filter((c) => c.username.toLowerCase().includes(term));
  }, [creators, search]);

  const hasMany = creators.length > CREATORS_INITIAL_LIMIT;
  const isSearching = search.length > 0;
  const displayedCreators =
    isSearching || showAll
      ? filteredCreators
      : filteredCreators.slice(0, CREATORS_INITIAL_LIMIT);
  const hiddenCount = filteredCreators.length - CREATORS_INITIAL_LIMIT;

  return (
    <div className="space-y-2">
      {hasMany && (
        <div className="relative">
          <Search className="text-muted-foreground absolute left-2 top-1/2 size-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search creators..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowAll(false);
            }}
            className="h-8 pl-8 text-sm"
          />
        </div>
      )}
      {displayedCreators.map((creator) => (
        <label
          key={creator.username}
          className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md p-1.5"
        >
          <Checkbox
            checked={selected.includes(creator.username)}
            onCheckedChange={() => onToggle(creator.username)}
          />
          <span className="flex items-center gap-2">
            <AuthorAvatar
              src={creator.avatarUrl}
              alt={`${creator.username} avatar`}
              authorId={creator.authorId}
              onRefresh={onAuthorAvatarRefresh}
            />
            <span className="truncate text-sm">@{creator.username}</span>
          </span>
        </label>
      ))}
      {hasMany && !isSearching && !showAll && hiddenCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground w-full"
          onClick={() => setShowAll(true)}
        >
          Show +{hiddenCount} more
        </Button>
      )}
      {isSearching && filteredCreators.length === 0 && (
        <p className="text-muted-foreground py-2 text-center text-sm">
          No creators found
        </p>
      )}
    </div>
  );
}

export function RecipeFiltersDesktop({
  filters,
  onChange,
  options,
  tags,
  planTier,
  onAuthorAvatarRefresh,
}: RecipeFiltersProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false);

  const toggleArrayFilter = (key: keyof RecipeFilters, value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: updated });
    trackEvent("filter_applied", { filterType: key, value });
  };

  return (
    <div className="hidden flex-wrap items-center gap-2 lg:flex">
      {options.platforms.length > 0 && (
        <Popover
          open={openFilter === "platform"}
          onOpenChange={(open) => setOpenFilter(open ? "platform" : null)}
        >
          <PopoverTrigger asChild>
            <div>
              <FilterChip
                label="Platform"
                count={filters.platforms.length}
                isOpen={openFilter === "platform"}
                onClick={() => {}}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-48">
            <MultiSelectFilter
              options={options.platforms}
              selected={filters.platforms}
              onToggle={(value) => toggleArrayFilter("platforms", value)}
              renderOption={(platform) => {
                const Icon = platformIcons[platform];
                return (
                  <span className="flex items-center gap-2 text-sm">
                    {Icon && <Icon className="size-4" />}
                    {platformLabels[platform] || platform}
                  </span>
                );
              }}
            />
          </PopoverContent>
        </Popover>
      )}

      {options.creators.length > 0 && (
        <Popover
          open={openFilter === "creator"}
          onOpenChange={(open) => setOpenFilter(open ? "creator" : null)}
        >
          <PopoverTrigger asChild>
            <div>
              <FilterChip
                label="Creator"
                count={filters.creators.length}
                isOpen={openFilter === "creator"}
                onClick={() => {}}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="max-h-80 w-56 overflow-y-auto"
          >
            <CreatorFilterList
              creators={options.creators}
              selected={filters.creators}
              onToggle={(username) => toggleArrayFilter("creators", username)}
              onAuthorAvatarRefresh={onAuthorAvatarRefresh}
            />
          </PopoverContent>
        </Popover>
      )}

      <Popover
        open={openFilter === "difficulty"}
        onOpenChange={(open) => setOpenFilter(open ? "difficulty" : null)}
      >
        <PopoverTrigger asChild>
          <div>
            <FilterChip
              label="Difficulty"
              count={filters.difficulties.length}
              isOpen={openFilter === "difficulty"}
              onClick={() => {}}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-40">
          <MultiSelectFilter
            options={difficultyOptions}
            selected={filters.difficulties}
            onToggle={(value) => toggleArrayFilter("difficulties", value)}
          />
        </PopoverContent>
      </Popover>

      <Popover
        open={openFilter === "recency"}
        onOpenChange={(open) => setOpenFilter(open ? "recency" : null)}
      >
        <PopoverTrigger asChild>
          <div>
            <FilterChip
              label="Recency"
              count={filters.recency ? 1 : 0}
              isOpen={openFilter === "recency"}
              onClick={() => {}}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-40">
          <RadioGroup
            value={filters.recency || ""}
            onValueChange={(value) =>
              onChange({
                ...filters,
                recency: (value as RecencyOption) || null,
              })
            }
          >
            {recencyOptions.map((option) => (
              <label
                key={option.value}
                className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md p-1.5"
              >
                <RadioGroupItem value={option.value} />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </RadioGroup>
          {filters.recency && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => onChange({ ...filters, recency: null })}
            >
              Clear
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {options.cuisines.length > 0 && (
        <Popover
          open={openFilter === "cuisine"}
          onOpenChange={(open) => setOpenFilter(open ? "cuisine" : null)}
        >
          <PopoverTrigger asChild>
            <div>
              <FilterChip
                label="Cuisine"
                count={filters.cuisines.length}
                isOpen={openFilter === "cuisine"}
                onClick={() => {}}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="max-h-64 w-48 overflow-y-auto"
          >
            <MultiSelectFilter
              options={options.cuisines}
              selected={filters.cuisines}
              onToggle={(value) => toggleArrayFilter("cuisines", value)}
            />
          </PopoverContent>
        </Popover>
      )}

      {tags && tags.length > 0 && (
        <Popover
          open={openFilter === "tags"}
          onOpenChange={(open) => setOpenFilter(open ? "tags" : null)}
        >
          <PopoverTrigger asChild>
            <div>
              <FilterChip
                label="Tags"
                count={filters.tagIds.length}
                isOpen={openFilter === "tags"}
                onClick={() => {}}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="max-h-64 w-48 overflow-y-auto"
          >
            <div className="space-y-2">
              {tags.map((tag) => (
                <label
                  key={tag._id}
                  className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md p-1.5"
                >
                  <Checkbox
                    checked={filters.tagIds.includes(tag._id!)}
                    onCheckedChange={() => toggleArrayFilter("tagIds", tag._id!)}
                  />
                  <span className="truncate text-sm">
                    #{tag.name}
                  </span>
                </label>
              ))}
              {planTier && (
                <div className="border-t pt-2 mt-2">
                  <button
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground  cursor-pointer"
                    onClick={() => {
                      setOpenFilter(null);
                      setCreateTagDialogOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Create tag
                  </button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {planTier && (
        <CreateTagDialog
          open={createTagDialogOpen}
          onOpenChange={setCreateTagDialogOpen}
          currentCount={tags?.length ?? 0}
          planTier={planTier}
        />
      )}
    </div>
  );
}

export function RecipeFiltersMobile({
  filters,
  onChange,
  options,
  activeCount,
  collections,
  selectedCollectionId,
  onSelectCollection,
  totalRecipeCount,
  tags,
  planTier,
  onAuthorAvatarRefresh,
}: RecipeFiltersMobileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false);

  const toggleArrayFilter = (key: keyof RecipeFilters, value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: updated });
    trackEvent("filter_applied", { filterType: key, value });
  };

  const hasCollections = collections && collections.length > 0;
  const selectedCollection = selectedCollectionId
    ? collections?.find((c) => c._id === selectedCollectionId)
    : null;

  return (
    <div className="lg:hidden">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Filter className="size-4" />
              Filters
              {selectedCollection && (
                <span className="text-muted-foreground">
                  · {selectedCollection.name}
                </span>
              )}
            </span>
            {activeCount > 0 && (
              <span className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full text-xs">
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="max-h-[70vh] w-[calc(100vw-2rem)] overflow-y-auto"
        >
          <div className="space-y-6">
            {(hasCollections || onSelectCollection) && (
              <div>
                <h4 className="mb-2 text-sm font-medium flex items-center gap-2">
                  <FolderOpen className="size-4" />
                  Collections
                </h4>
                <div className="space-y-1">
                  <button
                    onClick={() => onSelectCollection?.(null)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left cursor-pointer",
                      !selectedCollectionId
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50",
                    )}
                  >
                    <span className="flex-1">All Recipes</span>
                    <span className="text-xs text-muted-foreground">
                      {totalRecipeCount}
                    </span>
                  </button>
                  {collections?.map((collection) => (
                    <button
                      key={collection._id}
                      onClick={() => onSelectCollection?.(collection._id!)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left cursor-pointer",
                        selectedCollectionId === collection._id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50",
                      )}
                    >
                      <span
                        className="size-3 rounded-full shrink-0"
                        style={{ backgroundColor: collection.color }}
                      />
                      <span className="truncate flex-1">{collection.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {collection.recipeCount}
                      </span>
                    </button>
                  ))}
                  {planTier && (
                    <button
                      onClick={() => setCreateDialogOpen(true)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left cursor-pointer hover:bg-accent/50 text-muted-foreground"
                    >
                      <Plus className="size-3" />
                      <span>New collection</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {options.platforms.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Platform</h4>
                <MultiSelectFilter
                  options={options.platforms}
                  selected={filters.platforms}
                  onToggle={(value) => toggleArrayFilter("platforms", value)}
                  renderOption={(platform) => {
                    const Icon = platformIcons[platform];
                    return (
                      <span className="flex items-center gap-2 text-sm">
                        {Icon && <Icon className="size-4" />}
                        {platformLabels[platform] || platform}
                      </span>
                    );
                  }}
                />
              </div>
            )}

            {options.creators.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Creator</h4>
                <CreatorFilterList
                  creators={options.creators}
                  selected={filters.creators}
                  onToggle={(username) =>
                    toggleArrayFilter("creators", username)
                  }
                  onAuthorAvatarRefresh={onAuthorAvatarRefresh}
                />
              </div>
            )}

            <div>
              <h4 className="mb-2 text-sm font-medium">Difficulty</h4>
              <MultiSelectFilter
                options={difficultyOptions}
                selected={filters.difficulties}
                onToggle={(value) => toggleArrayFilter("difficulties", value)}
              />
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium">Recency</h4>
              <RadioGroup
                value={filters.recency || ""}
                onValueChange={(value) =>
                  onChange({
                    ...filters,
                    recency: (value as RecencyOption) || null,
                  })
                }
              >
                {recencyOptions.map((option) => (
                  <label
                    key={option.value}
                    className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md p-1.5"
                  >
                    <RadioGroupItem value={option.value} />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {options.cuisines.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Cuisine</h4>
                <MultiSelectFilter
                  options={options.cuisines}
                  selected={filters.cuisines}
                  onToggle={(value) => toggleArrayFilter("cuisines", value)}
                />
              </div>
            )}

            {tags && tags.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium flex items-center gap-2">
                  <Tag className="size-4" />
                  Tags
                </h4>
                <div className="space-y-1">
                  {tags.map((tag) => (
                    <label
                      key={tag._id}
                      className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md p-1.5"
                    >
                      <Checkbox
                        checked={filters.tagIds.includes(tag._id!)}
                        onCheckedChange={() => toggleArrayFilter("tagIds", tag._id!)}
                      />
                      <span className="truncate text-sm">
                        #{tag.name}
                      </span>
                    </label>
                  ))}
                  {planTier && (
                    <button
                      onClick={() => setCreateTagDialogOpen(true)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left hover:bg-accent/50 text-muted-foreground cursor-pointer"
                    >
                      <Plus className="size-3" />
                      <span>New tag</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {planTier && (
        <CreateCollectionDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          currentCount={collections?.length ?? 0}
          planTier={planTier}
        />
      )}

      {planTier && (
        <CreateTagDialog
          open={createTagDialogOpen}
          onOpenChange={setCreateTagDialogOpen}
          currentCount={tags?.length ?? 0}
          planTier={planTier}
        />
      )}
    </div>
  );
}

export function ActiveFilterChips({
  filters,
  onChange,
  tags,
}: {
  filters: RecipeFilters;
  onChange: (filters: RecipeFilters) => void;
  tags?: TagType[];
}) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  for (const platform of filters.platforms) {
    chips.push({
      key: `platform-${platform}`,
      label: platformLabels[platform] || platform,
      onRemove: () =>
        onChange({
          ...filters,
          platforms: filters.platforms.filter((p) => p !== platform),
        }),
    });
  }

  for (const creator of filters.creators) {
    chips.push({
      key: `creator-${creator}`,
      label: `@${creator}`,
      onRemove: () =>
        onChange({
          ...filters,
          creators: filters.creators.filter((c) => c !== creator),
        }),
    });
  }

  for (const difficulty of filters.difficulties) {
    chips.push({
      key: `difficulty-${difficulty}`,
      label: difficulty,
      onRemove: () =>
        onChange({
          ...filters,
          difficulties: filters.difficulties.filter((d) => d !== difficulty),
        }),
    });
  }

  if (filters.recency) {
    const recencyLabel = recencyOptions.find(
      (o) => o.value === filters.recency,
    )?.label;
    chips.push({
      key: "recency",
      label: recencyLabel || filters.recency,
      onRemove: () => onChange({ ...filters, recency: null }),
    });
  }

  for (const cuisine of filters.cuisines) {
    chips.push({
      key: `cuisine-${cuisine}`,
      label: cuisine,
      onRemove: () =>
        onChange({
          ...filters,
          cuisines: filters.cuisines.filter((c) => c !== cuisine),
        }),
    });
  }

  for (const tagId of filters.tagIds) {
    const tag = tags?.find((t) => t._id === tagId);
    if (tag) {
      chips.push({
        key: `tag-${tagId}`,
        label: `#${tag.name}`,
        onRemove: () =>
          onChange({
            ...filters,
            tagIds: filters.tagIds.filter((id) => id !== tagId),
          }),
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="hover:bg-secondary-foreground/20 rounded-full p-0.5  cursor-pointer"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
