import { render, screen, fireEvent } from '@testing-library/react';
import { InstructionDiffView } from '../InstructionDiffView';

describe('InstructionDiffView', () => {
  it('renders diff with added and removed words', () => {
    render(
      <InstructionDiffView
        original="Chop onions finely."
        refined="Chop the onions very finely."
        onAccept={() => {}}
        onReject={() => {}}
      />
    );
    expect(screen.getByText('Chop')).toBeInTheDocument();
    expect(screen.getByText('onions')).toBeInTheDocument();
    expect(screen.getByText('finely.')).toBeInTheDocument();
    expect(screen.getByText('the')).toBeInTheDocument();
    expect(screen.getByText('very')).toBeInTheDocument();
  });

  it('calls onAccept and onReject', () => {
    const onAccept = jest.fn();
    const onReject = jest.fn();
    render(
      <InstructionDiffView
        original="Mix flour."
        refined="Mix the flour."
        onAccept={onAccept}
        onReject={onReject}
      />
    );
    fireEvent.click(screen.getByText('✓ Accept'));
    expect(onAccept).toHaveBeenCalled();
    fireEvent.click(screen.getByText('✗ Reject'));
    expect(onReject).toHaveBeenCalled();
  });

  it('shows loading spinner when isLoading', () => {
    render(
      <InstructionDiffView
        original="Bake for 20 min."
        refined="Bake for 20 minutes."
        onAccept={() => {}}
        onReject={() => {}}
        isLoading={true}
      />
    );
    expect(screen.getByText('⏳')).toBeInTheDocument();
    expect(screen.getByText('✓ Accept')).toBeDisabled();
    expect(screen.getByText('✗ Reject')).toBeDisabled();
  });
});
