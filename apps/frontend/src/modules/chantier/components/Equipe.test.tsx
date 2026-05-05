import { render, screen, fireEvent } from "@testing-library/react"
import { Equipe } from "../components/Equipe"

describe("Equipe", () => {
  it("affiche la liste et ajoute un membre", async () => {
    render(<Equipe membres={[]} />)
    expect(screen.getByText(/Équipe/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: "Alice" } })
    fireEvent.click(screen.getByText(/Ajouter/))
    // Attendre que le membre soit affiché
    expect(await screen.findByText("Alice")).toBeInTheDocument()
  })
})
