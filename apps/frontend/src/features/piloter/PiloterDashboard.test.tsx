

import { render, screen, fireEvent, act } from "@testing-library/react"
import { PiloterDashboard } from "./PiloterDashboard"

describe("PiloterDashboard", () => {
  it("affiche les stats et permet de signaler un incident", async () => {
    render(<PiloterDashboard />)
    expect(screen.getByText(/Budget/)).toBeInTheDocument()
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Nouvel incident/), { target: { value: "Test incident" } })
      fireEvent.click(screen.getByText(/Signaler/))
    })
    expect(await screen.findByText(/Incident signalé/)).toBeInTheDocument()
  })
})
