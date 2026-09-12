import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterTypeaheadCombobox } from './FilterTypeaheadCombobox'

describe('FilterTypeaheadCombobox', () => {
  const defaultProps = {
    label: 'Dietary Requirements',
    placeholder: 'Search diet...',
    options: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Dairy-Free'],
    selected: ['Vegan'],
    onChange: vi.fn(),
    quickOptions: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    allowCustom: true,
  }

  it('renders label, selected chip, and search input', () => {
    render(<FilterTypeaheadCombobox {...defaultProps} />)
    expect(screen.getByText('Dietary Requirements')).toBeInTheDocument()
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    expect(screen.getByText('Vegan')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('filters options when typing in combobox', () => {
    render(<FilterTypeaheadCombobox {...defaultProps} />)
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'glu' } })

    expect(screen.getByRole('button', { name: 'Gluten-Free' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Vegetarian' })).not.toBeInTheDocument()
  })

  it('toggles selection when clicking an option', () => {
    render(<FilterTypeaheadCombobox {...defaultProps} />)
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'glu' } })

    const option = screen.getByRole('button', { name: 'Gluten-Free' })
    fireEvent.click(option)

    expect(defaultProps.onChange).toHaveBeenCalledWith(['Vegan', 'Gluten-Free'])
  })

  it('removes option when clicking remove button on chip', () => {
    render(<FilterTypeaheadCombobox {...defaultProps} />)
    const removeBtn = screen.getByRole('button', { name: /Remove Vegan/i })
    fireEvent.click(removeBtn)

    expect(defaultProps.onChange).toHaveBeenCalledWith([])
  })

  it('allows 1-click toggling via quick option pills', () => {
    render(<FilterTypeaheadCombobox {...defaultProps} />)
    const vegPill = screen.getByRole('button', { name: /\+ Vegetarian/i })
    fireEvent.click(vegPill)

    expect(defaultProps.onChange).toHaveBeenCalledWith(['Vegan', 'Vegetarian'])
  })

  it('supports keyboard navigation and enter to select', () => {
    render(<FilterTypeaheadCombobox {...defaultProps} />)
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'keto' } })

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(defaultProps.onChange).toHaveBeenCalledWith(['Vegan', 'Keto'])
  })

  it('removes last selected item on Backspace when query is empty', () => {
    render(<FilterTypeaheadCombobox {...defaultProps} />)
    const input = screen.getByRole('combobox')

    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(defaultProps.onChange).toHaveBeenCalledWith([])
  })

  it('allows adding custom option when allowCustom is true', () => {
    render(<FilterTypeaheadCombobox {...defaultProps} />)
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'Pescatarian' } })

    const addCustomBtn = screen.getByRole('button', { name: /Add "Pescatarian"/i })
    fireEvent.click(addCustomBtn)

    expect(defaultProps.onChange).toHaveBeenCalledWith(['Vegan', 'Pescatarian'])
  })

  it('strips commas from custom tags to maintain URL compatibility', () => {
    render(<FilterTypeaheadCombobox {...defaultProps} />)
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'Italian, Quick' } })

    const addCustomBtn = screen.getByRole('button', { name: /Add "Italian Quick"/i })
    fireEvent.click(addCustomBtn)

    expect(defaultProps.onChange).toHaveBeenCalledWith(['Vegan', 'Italian Quick'])
  })

  it('closes dropdown when clicking outside only when open', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    const { unmount } = render(<FilterTypeaheadCombobox {...defaultProps} />)
    // Initially closed: mousedown listener should not be active
    expect(addEventListenerSpy).not.toHaveBeenCalledWith('mousedown', expect.any(Function))

    // Open combobox
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))

    // Click outside
    fireEvent.mouseDown(document.body)

    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })
})
