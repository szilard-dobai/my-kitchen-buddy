import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CollectionDropdown } from "@/components/collections/collection-dropdown";
import { CollectionSidebar } from "@/components/collections/collection-sidebar";
import { CreateCollectionDialog } from "@/components/collections/create-collection-dialog";
import { DeleteCollectionDialog } from "@/components/collections/delete-collection-dialog";
import {
  mockCollection,
  mockCollection2,
  mockCollection3,
} from "../../mocks/fixtures";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
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

beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

describe("CollectionSidebar", () => {
  const mockOnSelectCollection = vi.fn();

  beforeEach(() => {
    mockOnSelectCollection.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders 'All Recipes' option", () => {
    renderWithQueryClient(
      <CollectionSidebar
        collections={[]}
        selectedCollectionId={null}
        onSelectCollection={mockOnSelectCollection}
        totalRecipeCount={10}
        planTier="free"
      />,
    );

    expect(screen.getByText("All Recipes")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders list of collections with counts", () => {
    const collections = [mockCollection, mockCollection2];

    renderWithQueryClient(
      <CollectionSidebar
        collections={collections}
        selectedCollectionId={null}
        onSelectCollection={mockOnSelectCollection}
        totalRecipeCount={10}
        planTier="free"
      />,
    );

    expect(screen.getByText("Weeknight Dinners")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Meal Prep")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("highlights selected collection", () => {
    const collections = [mockCollection, mockCollection2];

    renderWithQueryClient(
      <CollectionSidebar
        collections={collections}
        selectedCollectionId="col-123"
        onSelectCollection={mockOnSelectCollection}
        totalRecipeCount={10}
        planTier="free"
      />,
    );

    const selectedItem = screen.getByText("Weeknight Dinners").closest("button")?.parentElement;
    expect(selectedItem).toHaveClass("bg-accent");
  });

  it("shows '+' button to create collection", () => {
    renderWithQueryClient(
      <CollectionSidebar
        collections={[]}
        selectedCollectionId={null}
        onSelectCollection={mockOnSelectCollection}
        totalRecipeCount={10}
        planTier="free"
      />,
    );

    expect(screen.getByRole("button", { name: /create collection/i })).toBeInTheDocument();
  });

  it("calls onSelectCollection when collection clicked", async () => {
    const user = userEvent.setup();
    const collections = [mockCollection];

    renderWithQueryClient(
      <CollectionSidebar
        collections={collections}
        selectedCollectionId={null}
        onSelectCollection={mockOnSelectCollection}
        totalRecipeCount={10}
        planTier="free"
      />,
    );

    await user.click(screen.getByText("Weeknight Dinners"));

    expect(mockOnSelectCollection).toHaveBeenCalledWith("col-123");
  });

  it("calls onSelectCollection with null when 'All Recipes' clicked", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(
      <CollectionSidebar
        collections={[mockCollection]}
        selectedCollectionId="col-123"
        onSelectCollection={mockOnSelectCollection}
        totalRecipeCount={10}
        planTier="free"
      />,
    );

    await user.click(screen.getByText("All Recipes"));

    expect(mockOnSelectCollection).toHaveBeenCalledWith(null);
  });
});

describe("CollectionDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders folder icon button", () => {
    renderWithQueryClient(
      <CollectionDropdown
        recipeId="recipe-123"
        collections={[]}
      />,
    );

    expect(screen.getByRole("button", { name: /add to collection/i })).toBeInTheDocument();
  });

  it("renders with correct accessible name", () => {
    renderWithQueryClient(
      <CollectionDropdown
        recipeId="recipe-123"
        collections={[mockCollection]}
      />,
    );

    const button = screen.getByRole("button", { name: /add to collection/i });
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("accepts planTier prop", () => {
    renderWithQueryClient(
      <CollectionDropdown
        recipeId="recipe-123"
        collections={[]}
        planTier="pro"
      />,
    );

    expect(screen.getByRole("button", { name: /add to collection/i })).toBeInTheDocument();
  });

  it("passes collections to component", () => {
    const collections = [mockCollection, mockCollection2];

    renderWithQueryClient(
      <CollectionDropdown
        recipeId="recipe-123"
        collections={collections}
      />,
    );

    expect(screen.getByRole("button", { name: /add to collection/i })).toBeInTheDocument();
  });
});

describe("CreateCollectionDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders name input and color picker", () => {
    renderWithQueryClient(
      <CreateCollectionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreated={mockOnCreated}
        currentCount={0}
        planTier="free"
      />,
    );

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByText(/color/i)).toBeInTheDocument();
  });

  it("disables submit when name is empty", () => {
    renderWithQueryClient(
      <CreateCollectionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreated={mockOnCreated}
        currentCount={0}
        planTier="free"
      />,
    );

    const createButton = screen.getByRole("button", { name: /^create$/i });
    expect(createButton).toBeDisabled();
  });

  it("enables submit when name has value", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(
      <CreateCollectionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreated={mockOnCreated}
        currentCount={0}
        planTier="free"
      />,
    );

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, "My Collection");

    const createButton = screen.getByRole("button", { name: /^create$/i });
    expect(createButton).not.toBeDisabled();
  });

  it("shows limit warning for free users at 3/3", () => {
    renderWithQueryClient(
      <CreateCollectionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreated={mockOnCreated}
        currentCount={3}
        planTier="free"
      />,
    );

    expect(screen.getByText(/collection limit reached/i)).toBeInTheDocument();
    expect(screen.getByText(/3\/3/)).toBeInTheDocument();
    expect(screen.getByText(/upgrade to pro/i)).toBeInTheDocument();
  });

  it("does not show limit warning for pro users", () => {
    renderWithQueryClient(
      <CreateCollectionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreated={mockOnCreated}
        currentCount={10}
        planTier="pro"
      />,
    );

    expect(screen.queryByText(/collection limit reached/i)).not.toBeInTheDocument();
  });

  it("calls onCreated on successful submit", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ _id: "new-col" }),
    } as Response);

    renderWithQueryClient(
      <CreateCollectionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onCreated={mockOnCreated}
        currentCount={0}
        planTier="free"
      />,
    );

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, "My Collection");

    const createButton = screen.getByRole("button", { name: /^create$/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockOnCreated).toHaveBeenCalled();
    });
  });
});

describe("DeleteCollectionDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnDeleted = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows collection name in confirmation message", () => {
    renderWithQueryClient(
      <DeleteCollectionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        collection={mockCollection}
        onDeleted={mockOnDeleted}
      />,
    );

    expect(screen.getByText(/weeknight dinners/i)).toBeInTheDocument();
  });

  it("shows recipe count when collection has recipes", () => {
    renderWithQueryClient(
      <DeleteCollectionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        collection={mockCollection}
        onDeleted={mockOnDeleted}
      />,
    );

    expect(screen.getByText(/5 recipes will be removed/i)).toBeInTheDocument();
  });

  it("does not show recipe count when collection is empty", () => {
    renderWithQueryClient(
      <DeleteCollectionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        collection={mockCollection3}
        onDeleted={mockOnDeleted}
      />,
    );

    expect(screen.queryByText(/recipes will be removed/i)).not.toBeInTheDocument();
  });

  it("calls onDeleted when confirmed", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    renderWithQueryClient(
      <DeleteCollectionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        collection={mockCollection}
        onDeleted={mockOnDeleted}
      />,
    );

    const deleteButton = screen.getByRole("button", { name: /^delete$/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockOnDeleted).toHaveBeenCalled();
    });
  });

  it("closes without action when cancelled", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(
      <DeleteCollectionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        collection={mockCollection}
        onDeleted={mockOnDeleted}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnDeleted).not.toHaveBeenCalled();
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
