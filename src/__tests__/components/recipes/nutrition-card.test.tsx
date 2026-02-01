import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { NutritionCard } from "@/components/recipes/nutrition-card";

describe("NutritionCard", () => {
  it("returns null when no nutrition data", () => {
    const { container } = render(<NutritionCard nutrition={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when nutrition data has no values", () => {
    const { container } = render(
      <NutritionCard nutrition={{ perServing: {}, per100g: {} }} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders per serving data by default", () => {
    render(
      <NutritionCard
        nutrition={{
          perServing: { calories: 350, protein: 25 },
        }}
      />,
    );

    expect(screen.getByText("Nutrition Facts")).toBeInTheDocument();
    expect(screen.getByText("350")).toBeInTheDocument();
    expect(screen.getByText("Calories")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("Protein")).toBeInTheDocument();
  });

  it("renders per 100g data when only that exists", () => {
    render(
      <NutritionCard
        nutrition={{
          per100g: { calories: 200, carbs: 30 },
        }}
      />,
    );

    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("Calories")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("Carbs")).toBeInTheDocument();
  });

  it("renders tab switcher when both data types exist", () => {
    render(
      <NutritionCard
        nutrition={{
          perServing: { calories: 350 },
          per100g: { calories: 200 },
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /per serving/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /per 100g/i })).toBeInTheDocument();
  });

  it("does not render tab switcher when only one data type exists", () => {
    render(
      <NutritionCard
        nutrition={{
          perServing: { calories: 350 },
        }}
      />,
    );

    expect(screen.queryByRole("button", { name: /per serving/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /per 100g/i })).not.toBeInTheDocument();
  });

  it("switches to per 100g view on tab click", async () => {
    const user = userEvent.setup();

    render(
      <NutritionCard
        nutrition={{
          perServing: { calories: 350 },
          per100g: { calories: 200 },
        }}
      />,
    );

    expect(screen.getByText("350")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /per 100g/i }));

    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("switches to per serving view on tab click", async () => {
    const user = userEvent.setup();

    render(
      <NutritionCard
        nutrition={{
          perServing: { calories: 350 },
          per100g: { calories: 200 },
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /per 100g/i }));
    expect(screen.getByText("200")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /per serving/i }));
    expect(screen.getByText("350")).toBeInTheDocument();
  });

  it("displays all nutrition values with correct units", () => {
    render(
      <NutritionCard
        nutrition={{
          perServing: {
            calories: 350,
            protein: 25,
            carbs: 30,
            fat: 15,
            fiber: 8,
            sugar: 5,
            sodium: 400,
          },
        }}
      />,
    );

    expect(screen.getByText("350")).toBeInTheDocument();
    expect(screen.getByText("kcal")).toBeInTheDocument();
    expect(screen.getByText("Calories")).toBeInTheDocument();

    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("Protein")).toBeInTheDocument();

    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("Carbs")).toBeInTheDocument();

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Fat")).toBeInTheDocument();

    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("Fiber")).toBeInTheDocument();

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Sugar")).toBeInTheDocument();

    expect(screen.getByText("400")).toBeInTheDocument();
    expect(screen.getByText("mg")).toBeInTheDocument();
    expect(screen.getByText("Sodium")).toBeInTheDocument();
  });

  it("omits fields that are undefined", () => {
    render(
      <NutritionCard
        nutrition={{
          perServing: {
            calories: 350,
            protein: 25,
          },
        }}
      />,
    );

    expect(screen.getByText("350")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.queryByText("Carbs")).not.toBeInTheDocument();
    expect(screen.queryByText("Fat")).not.toBeInTheDocument();
    expect(screen.queryByText("Fiber")).not.toBeInTheDocument();
    expect(screen.queryByText("Sugar")).not.toBeInTheDocument();
    expect(screen.queryByText("Sodium")).not.toBeInTheDocument();
  });
});
