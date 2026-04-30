import { render, screen, fireEvent } from "@testing-library/react"
import { DocumentList } from "../components/DocumentList"

describe("DocumentList", () => {
  it("affiche la liste des documents et permet d’en ajouter", async () => {
    const onSelect = jest.fn()
    render(<DocumentList projectId="demo" onSelect={onSelect} />)
    expect(screen.getByText(/Documents/)).toBeInTheDocument()
    // Simule l’ajout d’un document
    fireEvent.click(screen.getByText(/Nouveau/))
    fireEvent.change(screen.getByLabelText(/Titre/), { target: { value: "Doc test" } })
    fireEvent.click(screen.getByText(/Valider/))
    // Le nouveau document devrait apparaître (mocké)
    // ...
  })
})
