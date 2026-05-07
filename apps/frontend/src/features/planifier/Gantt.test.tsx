
import React from 'react';
import { render, screen, fireEvent, act } from "@testing-library/react"
import { Gantt } from "./Gantt"

describe("Gantt", () => {
  it("affiche les tâches et permet d'en ajouter", async () => {
    render(<Gantt />)
    // Le composant affiche plusieurs occurrences de chaque tâche (liste + barre Gantt)
    expect(screen.getAllByText(/Terrassement/).length).toBeGreaterThan(0)
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: "Test tâche" } })
      fireEvent.change(screen.getByLabelText(/Début/), { target: { value: "2026-06-01" } })
      fireEvent.change(screen.getByLabelText(/Fin/), { target: { value: "2026-06-02" } })
      fireEvent.change(screen.getByLabelText(/Personnes/), { target: { value: "Ahmed" } })
      fireEvent.click(screen.getByRole('button', { name: /Ajouter la tâche/ }))
    })
    const matches = await screen.findAllByText("Test tâche")
    expect(matches.length).toBeGreaterThan(0)
  })
})
