import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProgressCharts from "./progress-charts";

describe("progress charts", () => {
  it("shows useful empty states when data is insufficient", () => {
    render(<ProgressCharts logs={[]} waterGoalMl={2500} />);
    expect(screen.getByText(/record weight on two days/i)).toBeInTheDocument();
    expect(screen.getByText(/add water to a daily check-in/i)).toBeInTheDocument();
    expect(screen.getByText(/complete a meal/i)).toBeInTheDocument();
  });
});
