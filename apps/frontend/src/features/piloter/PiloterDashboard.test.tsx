import { render, screen, fireEvent } from "@testing-library/react"
import { PiloterDashboard } from "../PiloterDashboard"

describe("PiloterDashboard", () => {
  it("affiche les stats et permet de signaler un incident", () => {
    render(<PiloterDashboard />)
    expect(screen.getByText(/Budget/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Nouvel incident/), { target: { value: "Test incident" } })
    fireEvent.click(screen.getByText(/Signaler/))
    expect(screen.getByText(/Incident signalé/)).toBeInTheDocument()
  })
})
