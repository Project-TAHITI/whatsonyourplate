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
});
