import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PantryVisionScannerModal } from '../PantryVisionScannerModal'
import * as aiApi from '../../../../utils/aiApi'

vi.mock('../../../../utils/aiApi')

describe('PantryVisionScannerModal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <PantryVisionScannerModal
        isOpen={false}
        onClose={vi.fn()}
        onImportIngredients={vi.fn()}
      />
    )

    expect(screen.queryByText(/Fridge Raid Vision Scanner/i)).not.toBeInTheDocument()
  })

  it('renders modal content when isOpen is true', () => {
    render(
      <PantryVisionScannerModal
        isOpen={true}
        onClose={vi.fn()}
        onImportIngredients={vi.fn()}
      />
    )

    expect(screen.getByText(/Fridge Raid Vision Scanner/i)).toBeInTheDocument()
    expect(screen.getByText(/Upload or Take a Photo of your Fridge/i)).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <PantryVisionScannerModal
        isOpen={true}
        onClose={onClose}
        onImportIngredients={vi.fn()}
      />
    )

    const closeBtn = screen.getByLabelText(/Close modal/i)
    fireEvent.click(closeBtn)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('analyzes image and imports detected ingredients', async () => {
    vi.mocked(aiApi.scanIngredientsFromImage).mockResolvedValue(['tomatoes', 'basil', 'mozzarella'])
    const onImport = vi.fn()

    render(
      <PantryVisionScannerModal
        isOpen={true}
        onClose={vi.fn()}
        onImportIngredients={onImport}
      />
    )

    // Create a dummy image file
    const file = new File(['fake-image'], 'fridge.jpg', { type: 'image/jpeg' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('tomatoes')).toBeInTheDocument()
      expect(screen.getByText('basil')).toBeInTheDocument()
      expect(screen.getByText('mozzarella')).toBeInTheDocument()
    })

    const importBtn = screen.getByRole('button', { name: /Import 3 Ingredients to Pantry/i })
    fireEvent.click(importBtn)

    expect(onImport).toHaveBeenCalledWith(['tomatoes', 'basil', 'mozzarella'])
  })
})
