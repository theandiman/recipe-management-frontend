import { vi } from "vitest";import { renderHook, act } from '@testing-library/react';
import { useInstructionRefinement } from '../useInstructionRefinement';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ refinements: [{ stepIndex: 0, original: 'Mix', refined: 'Mix well', changesSummary: 'Added "well"' }] })
  })
) as vi.Mock;

describe('useInstructionRefinement', () => {
  it('refines a single step', async () => {
    const updateInstruction = vi.fn();
    const { result } = renderHook(() => useInstructionRefinement(updateInstruction));
    await act(async () => {
      await result.current.refineSingle(0, 'Mix');
    });
    expect(result.current.stepStates.get(0)?.refined).toBe('Mix well');
    expect(result.current.loadingState).toBe('success');
  });

  it('accepts a refinement', async () => {
    const updateInstruction = vi.fn();
    const { result } = renderHook(() => useInstructionRefinement(updateInstruction));
    await act(async () => {
      await result.current.refineSingle(0, 'Mix');
    });
    act(() => {
      result.current.acceptStep(0);
    });
    expect(updateInstruction).toHaveBeenCalledWith(0, 'Mix well');
    expect(result.current.stepStates.get(0)?.status).toBe('accepted');
  });

  it('rejects a refinement', async () => {
    const updateInstruction = vi.fn();
    const { result } = renderHook(() => useInstructionRefinement(updateInstruction));
    await act(async () => {
      await result.current.refineSingle(0, 'Mix');
    });
    act(() => {
      result.current.rejectStep(0);
    });
    expect(result.current.stepStates.get(0)?.status).toBe('rejected');
  });

  it('handles API failure gracefully', async () => {
    (global.fetch as vi.Mock).mockImplementationOnce(() => Promise.reject(new Error('API down')));
    const updateInstruction = vi.fn();
    const { result } = renderHook(() => useInstructionRefinement(updateInstruction));
    await act(async () => {
      await result.current.refineSingle(0, 'Mix');
    });
    expect(result.current.error).toBe('API down');
    expect(result.current.loadingState).toBe('error');
  });

  it('refines all steps', async () => {
    const updateInstruction = vi.fn();
    const { result } = renderHook(() => useInstructionRefinement(updateInstruction));
    await act(async () => {
      await result.current.refineAll(['Mix', 'Bake']);
    });
    expect(result.current.stepStates.size).toBeGreaterThan(0);
  });

  it('accepts all refinements', async () => {
    const updateInstruction = vi.fn();
    const { result } = renderHook(() => useInstructionRefinement(updateInstruction));
    await act(async () => {
      await result.current.refineAll(['Mix', 'Bake']);
    });
    act(() => {
      result.current.acceptAll();
    });
    expect([...result.current.stepStates.values()].every(s => s.status === 'accepted')).toBe(true);
  });

  it('rejects all refinements', async () => {
    const updateInstruction = vi.fn();
    const { result } = renderHook(() => useInstructionRefinement(updateInstruction));
    await act(async () => {
      await result.current.refineAll(['Mix', 'Bake']);
    });
    act(() => {
      result.current.rejectAll();
    });
    expect([...result.current.stepStates.values()].every(s => s.status === 'rejected')).toBe(true);
  });

  it('clears refinements', async () => {
    const updateInstruction = vi.fn();
    const { result } = renderHook(() => useInstructionRefinement(updateInstruction));
    await act(async () => {
      await result.current.refineSingle(0, 'Mix');
    });
    act(() => {
      result.current.clearRefinements();
    });
    expect(result.current.stepStates.size).toBe(0);
    expect(result.current.loadingState).toBe('idle');
    expect(result.current.error).toBeNull();
  });
});
