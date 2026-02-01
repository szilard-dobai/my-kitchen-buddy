import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { RecipeLibrary } from "@/components/recipes/recipe-library";
import { mockRecipeList } from "../../mocks/fixtures";

vi.mock("@/lib/tracking", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: () => null,
    toString: () => "",
  }),
}));

vi.mock("@/hooks/use-collections", () => ({
  useCollections: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useAddRecipeToCollection: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useRemoveRecipeFromCollection: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCreateCollection: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderWithQueryClient(ui: ReactNode) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

// Mock for Radix UI pointer capture (not available in jsdom)
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

describe("RecipeLibrary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders empty state when no recipes", async () => {
    renderWithQueryClient(
      <RecipeLibrary initialRecipes={[]} initialCollections={[]} planTier="free" />,
    );

    expect(screen.getByText("No recipes yet.")).toBeInTheDocument();
    expect(screen.getByText("Extract your first recipe")).toBeInTheDocument();
  });

  it("renders recipe cards for each recipe", async () => {
    renderWithQueryClient(
      <RecipeLibrary
        initialRecipes={mockRecipeList}
        initialCollections={[]}
        planTier="free"
      />,
    );

    expect(screen.getByText("Test Pasta Recipe")).toBeInTheDocument();
    expect(screen.getByText("Healthy Salad Recipe")).toBeInTheDocument();
    expect(screen.getByText("Instagram Smoothie Bowl")).toBeInTheDocument();
    expect(screen.getByText("YouTube Cooking Tutorial")).toBeInTheDocument();
  });

  it("renders search input", async () => {
    renderWithQueryClient(
      <RecipeLibrary
        initialRecipes={mockRecipeList}
        initialCollections={[]}
        planTier="free"
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it("displays correct recipe count", async () => {
    renderWithQueryClient(
      <RecipeLibrary
        initialRecipes={mockRecipeList}
        initialCollections={[]}
        planTier="free"
      />,
    );

    expect(screen.getByText(/Showing 6 recipes/i)).toBeInTheDocument();
  });

  it("allows typing in search input", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithQueryClient(
      <RecipeLibrary
        initialRecipes={mockRecipeList}
        initialCollections={[]}
        planTier="free"
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, "Pasta");

    expect(searchInput).toHaveValue("Pasta");
  });

  it("filters recipes by search term (description match)", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithQueryClient(
      <RecipeLibrary
        initialRecipes={mockRecipeList}
        initialCollections={[]}
        planTier="free"
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, "TikTok");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    await waitFor(() => {
      expect(screen.getByText("Test Pasta Recipe")).toBeInTheDocument();
    });
  });

  it("filters recipes by search term (ingredient match)", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithQueryClient(
      <RecipeLibrary
        initialRecipes={mockRecipeList}
        initialCollections={[]}
        planTier="free"
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, "Parmesan");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    await waitFor(() => {
      expect(screen.getByText("Test Pasta Recipe")).toBeInTheDocument();
    });
  });

  it("shows no results message when filters match nothing", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithQueryClient(
      <RecipeLibrary
        initialRecipes={mockRecipeList}
        initialCollections={[]}
        planTier="free"
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, "nonexistentzzzxxx");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/No recipes match your search/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Clear all filters/i)).toBeInTheDocument();
  });

  it("sorts by newest first (default)", async () => {
    renderWithQueryClient(
      <RecipeLibrary
        initialRecipes={mockRecipeList}
        initialCollections={[]}
        planTier="free"
      />,
    );

    const cards = screen.getAllByRole("link");
    expect(cards.length).toBe(6);
    expect(within(cards[0]).getByText("Spicy Thai Curry")).toBeInTheDocument();
  });

  it("renders sort dropdown", async () => {
    renderWithQueryClient(
      <RecipeLibrary
        initialRecipes={mockRecipeList}
        initialCollections={[]}
        planTier="free"
      />,
    );

    const sortButton = screen.getByRole("combobox");
    expect(sortButton).toBeInTheDocument();
  });

  it("shows reset button when search has value", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    renderWithQueryClient(
      <RecipeLibrary
        initialRecipes={mockRecipeList}
        initialCollections={[]}
        planTier="free"
      />,
    );

    // Initially no reset button
    expect(
      screen.queryByRole("button", { name: /reset/i }),
    ).not.toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, "Pasta");

    // Trigger the debounce
    await act(async () => {
      vi.runAllTimers();
    });

    // Reset button appears after search is applied
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /reset/i }),
      ).toBeInTheDocument();
    });
  });

  it("handles recipes with missing optional fields", async () => {
    const recipesWithMissing = [
      {
        _id: "recipe-minimal",
        userId: "user-123",
        title: "Minimal Recipe",
        dietaryTags: [],
        ingredients: [],
        instructions: [],
        equipment: [],
        tipsAndNotes: [],
        collectionIds: [],
        source: {
          url: "https://www.tiktok.com/@test/video/123",
          platform: "tiktok" as const,
        },
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      },
    ];

    renderWithQueryClient(
      <RecipeLibrary
        initialRecipes={recipesWithMissing}
        initialCollections={[]}
        planTier="free"
      />,
    );

    expect(screen.getByText("Minimal Recipe")).toBeInTheDocument();
  });
});
