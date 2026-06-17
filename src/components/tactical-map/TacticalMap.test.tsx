import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { simulationController } from "@/core/controller";
import { TacticalMap } from "./TacticalMap";

function endState() {
  let state = simulationController.start("drone-following-cargo", "map-test");
  while (state.status === "running") state = simulationController.step(state);
  return state;
}

describe("TacticalMap", () => {
  it("rend un nœud par contact", () => {
    const state = endState();
    const { container } = render(<TacticalMap state={state} />);
    const nodes = container.querySelectorAll("[data-contact-id]");
    expect(nodes).toHaveLength(state.contacts.length);
  });

  it("appelle onSelectContact au clic sur un contact", () => {
    const state = endState();
    const onSelect = vi.fn();
    const { container } = render(
      <TacticalMap state={state} onSelectContact={onSelect} />,
    );
    const node = container.querySelector('[data-contact-id="C-042"]')!;
    fireEvent.click(node);
    expect(onSelect).toHaveBeenCalledWith("C-042");
  });

  it("affiche la raison du focus visuel", () => {
    const state = endState();
    const { getByText } = render(<TacticalMap state={state} />);
    expect(getByText(/sous surveillance/i)).toBeInTheDocument();
  });
});
