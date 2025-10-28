import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ThemeToggleButton from '../components/ui/ThemeToggleButton.jsx';

describe('ThemeToggleButton', () => {
  it('renders button and calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    const { getByRole } = render(
      <ThemeToggleButton mode="light" onToggle={onToggle} color="#000" />
    );
    const button = getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders an svg icon', () => {
    const { getByRole } = render(
      <ThemeToggleButton mode="dark" onToggle={() => {}} color="#fff" />
    );
    const button = getByRole('button', { name: /toggle theme/i });
    expect(button.querySelector('svg')).toBeTruthy();
  });

  it('shows circle (sun) in light mode and path (moon) in dark mode', () => {
    const { getByRole, rerender } = render(
      <ThemeToggleButton mode="light" onToggle={() => {}} color="#000" />
    );
    let button = getByRole('button', { name: /toggle theme/i });
    expect(button.querySelector('circle')).not.toBeNull();
    rerender(<ThemeToggleButton mode="dark" onToggle={() => {}} color="#fff" />);
    button = getByRole('button', { name: /toggle theme/i });
    expect(button.querySelector('path')).not.toBeNull();
  });

  it('has accessible label and is focusable', () => {
    const { getByRole } = render(
      <ThemeToggleButton mode="light" onToggle={() => {}} color="#000" />
    );
    const button = getByRole('button', { name: /toggle theme/i });
    expect(button.getAttribute('aria-label')).toBe('Toggle theme');
    expect(button.tabIndex).toBeGreaterThanOrEqual(0);
  });

  it('applies rotation transform on mode change', () => {
    const { getByRole, rerender } = render(
      <ThemeToggleButton mode="light" onToggle={() => {}} color="#000" />
    );
    const button = getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg?.style.transform).toContain('rotate(0deg)');
    rerender(<ThemeToggleButton mode="dark" onToggle={() => {}} color="#000" />);
    expect(svg?.style.transform).toContain('rotate(360deg)');
  });
});
