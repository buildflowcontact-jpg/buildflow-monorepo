import { render, screen, fireEvent } from "@testing-library/react"
import { Gantt } from "../Gantt"

describe("Gantt", () => {
  it("affiche les tâches et permet d’en ajouter", () => {
    render(<Gantt />)
    expect(screen.getByText(/Tâche/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: "Test tâche" } })
    fireEvent.change(screen.getByLabelText(/Début/), { target: { value: "2026-06-01" } })
    fireEvent.change(screen.getByLabelText(/Fin/), { target: { value: "2026-06-02" } })
    fireEvent.click(screen.getByText(/Ajouter/))
    expect(screen.getByText("Test tâche")).toBeInTheDocument()
  })
})
