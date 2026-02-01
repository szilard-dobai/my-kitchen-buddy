import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockRecipe, mockRecipeWithNutrition } from "../../mocks/fixtures";
import { server } from "../../mocks/server";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: mockBack,
  }),
}));

vi.mock("@/lib/tracking", () => ({
  trackEvent: vi.fn(),
}));

describe("RecipeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form sections", async () => {
    const { RecipeForm } = await import("@/components/recipes/recipe-form");
    render(<RecipeForm recipe={mockRecipe} />);

    expect(screen.getByText("Basic Info")).toBeInTheDocument();
    expect(screen.getByText("Nutrition Information (Optional)")).toBeInTheDocument();
    expect(screen.getByText("Ingredients")).toBeInTheDocument();
    expect(screen.getByText("Instructions")).toBeInTheDocument();
    expect(screen.getByText("Equipment")).toBeInTheDocument();
    expect(screen.getByText("Tips & Notes")).toBeInTheDocument();
  });

  it("pre-fills form with existing recipe data", async () => {
    const { RecipeForm } = await import("@/components/recipes/recipe-form");
    render(<RecipeForm recipe={mockRecipe} />);

    expect(screen.getByLabelText("Title *")).toHaveValue("Test Pasta Recipe");
    expect(screen.getByLabelText("Description")).toHaveValue(mockRecipe.description);
    expect(screen.getByLabelText("Cuisine")).toHaveValue("Italian");
    expect(screen.getByLabelText("Total Time")).toHaveValue("30 minutes");
    expect(screen.getByLabelText("Prep Time")).toHaveValue("10 minutes");
    expect(screen.getByLabelText("Cook Time")).toHaveValue("20 minutes");
    expect(screen.getByLabelText("Servings")).toHaveValue("4");
  });

  it("pre-fills nutrition data when available", async () => {
    const { RecipeForm } = await import("@/components/recipes/recipe-form");
    render(<RecipeForm recipe={mockRecipeWithNutrition} />);

    expect(screen.getByLabelText("Calories", { selector: "#caloriesPerServing" })).toHaveValue(350);
    expect(screen.getByLabelText("Protein (g)", { selector: "#proteinPerServing" })).toHaveValue(25);
  });

  it("updates title on input change", async () => {
    const user = userEvent.setup();
    const { RecipeForm } = await import("@/components/recipes/recipe-form");
    render(<RecipeForm recipe={mockRecipe} />);

    const titleInput = screen.getByLabelText("Title *");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated Recipe Title");

    expect(titleInput).toHaveValue("Updated Recipe Title");
  });

  it("adds new ingredient row when add button clicked", async () => {
    const user = userEvent.setup();
    const { RecipeForm } = await import("@/components/recipes/recipe-form");
    render(<RecipeForm recipe={mockRecipe} />);

    const initialIngredientInputs = screen.getAllByPlaceholderText("Ingredient name");
    const addButton = screen.getByRole("button", { name: /add ingredient/i });

    await user.click(addButton);

    const newIngredientInputs = screen.getAllByPlaceholderText("Ingredient name");
    expect(newIngredientInputs.length).toBe(initialIngredientInputs.length + 1);
  });

  it("removes ingredient row when remove button clicked", async () => {
    const user = userEvent.setup();
    const { RecipeForm } = await import("@/components/recipes/recipe-form");
    render(<RecipeForm recipe={mockRecipe} />);

    const ingredientInputs = screen.getAllByPlaceholderText("Ingredient name");
    const initialCount = ingredientInputs.length;

    const removeButtons = screen.getAllByRole("button", { name: "×" });
    await user.click(removeButtons[0]);

    const updatedIngredientInputs = screen.getAllByPlaceholderText("Ingredient name");
    expect(updatedIngredientInputs.length).toBe(initialCount - 1);
  });

  it("adds new instruction step when add button clicked", async () => {
    const user = userEvent.setup();
    const { RecipeForm } = await import("@/components/recipes/recipe-form");
    render(<RecipeForm recipe={mockRecipe} />);

    const initialSteps = screen.getAllByPlaceholderText("Describe this step...");
    const addButton = screen.getByRole("button", { name: /add step/i });

    await user.click(addButton);

    const newSteps = screen.getAllByPlaceholderText("Describe this step...");
    expect(newSteps.length).toBe(initialSteps.length + 1);
  });

  it("adds equipment item when add button clicked", async () => {
    const user = userEvent.setup();
    const { RecipeForm } = await import("@/components/recipes/recipe-form");
    render(<RecipeForm recipe={mockRecipe} />);

    const initialEquipment = screen.getAllByPlaceholderText("Equipment name");
    const addButton = screen.getByRole("button", { name: /add equipment/i });

    await user.click(addButton);

    const newEquipment = screen.getAllByPlaceholderText("Equipment name");
    expect(newEquipment.length).toBe(initialEquipment.length + 1);
  });

  it("adds tip when add button clicked", async () => {
    const user = userEvent.setup();
    const { RecipeForm } = await import("@/components/recipes/recipe-form");
    render(<RecipeForm recipe={mockRecipe} />);

    const initialTips = screen.getAllByPlaceholderText("Add a tip or note");
    const addButton = screen.getByRole("button", { name: /add tip/i });

    await user.click(addButton);

    const newTips = screen.getAllByPlaceholderText("Add a tip or note");
    expect(newTips.length).toBe(initialTips.length + 1);
  });

  it("submits form with updated data on save", async () => {
    const user = userEvent.setup();
    const { RecipeForm } = await import("@/components/recipes/recipe-form");
    const { trackEvent } = await import("@/lib/tracking");

    let capturedBody: unknown;
    server.use(
      http.put(`/api/recipes/${mockRecipe._id}`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );

    render(<RecipeForm recipe={mockRecipe} />);

    const titleInput = screen.getByLabelText("Title *");
    await user.clear(titleInput);
    await user.type(titleInput, "New Title");

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/recipes/${mockRecipe._id}`);
    });

    expect(trackEvent).toHaveBeenCalledWith("recipe_edited", { recipeId: mockRecipe._id });
    expect((capturedBody as { title: string }).title).toBe("New Title");
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    const { RecipeForm } = await import("@/components/recipes/recipe-form");

    server.use(
      http.put(`/api/recipes/${mockRecipe._id}`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ success: true });
      }),
    );

    render(<RecipeForm recipe={mockRecipe} />);

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveButton);

    expect(screen.getByRole("button", { name: /saving/i })).toBeInTheDocument();
  });

  it("displays error message on failed save", async () => {
    const user = userEvent.setup();
    const { RecipeForm } = await import("@/components/recipes/recipe-form");

    server.use(
      http.put(`/api/recipes/${mockRecipe._id}`, () => {
        return HttpResponse.json({ error: "Failed to update recipe" }, { status: 500 });
      }),
    );

    render(<RecipeForm recipe={mockRecipe} />);

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to update recipe")).toBeInTheDocument();
    });
  });

  it("calls router.back on cancel button click", async () => {
    const user = userEvent.setup();
    const { RecipeForm } = await import("@/components/recipes/recipe-form");
    render(<RecipeForm recipe={mockRecipe} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it("renders title as required field", async () => {
    const { RecipeForm } = await import("@/components/recipes/recipe-form");
    render(<RecipeForm recipe={mockRecipe} />);

    const titleInput = screen.getByLabelText("Title *");
    expect(titleInput).toHaveAttribute("required");
  });
});
