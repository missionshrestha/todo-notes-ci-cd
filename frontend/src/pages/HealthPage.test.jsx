import { render, screen } from "@testing-library/react";
import HealthPage from "./HealthPage";

test("renders Health Check heading", () => {
  render(<HealthPage />);
  expect(screen.getByText(/Health Check/i)).toBeInTheDocument();
});
