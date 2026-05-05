

import { render, screen, fireEvent, act } from "@testing-library/react"
import { Gantt } from "./Gantt"

describe("Gantt", () => {
  it("affiche les tâches et permet d’en ajouter", async () => {
    render(<Gantt />)
    expect(screen.getByText(/Tâche/)).toBeInTheDocument()
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: "Test tâche" } })
      fireEvent.change(screen.getByLabelText(/Début/), { target: { value: "2026-06-01" } })
      fireEvent.change(screen.getByLabelText(/Fin/), { target: { value: "2026-06-02" } })
      fireEvent.click(screen.getByText(/Ajouter/))
    })
    const matches = await screen.findAllByText("Test tâche")
    expect(matches.length).toBeGreaterThan(0)
  })
})
