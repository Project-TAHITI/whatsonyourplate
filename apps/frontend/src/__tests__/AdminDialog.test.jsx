import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import AdminDialog from '../components/AdminDialog.jsx';

describe('AdminDialog', () => {
  it('does not render dialog when closed', () => {
    const { queryByRole } = render(<AdminDialog open={false} onClose={() => {}} />);
    expect(queryByRole('dialog')).toBeNull();
  });

  it('flows through steps and calls onClose when selecting non-admin path', () => {
    const handleClose = vi.fn();
    const { getByText, getByRole } = render(<AdminDialog open={true} onClose={handleClose} />);
    expect(getByRole('dialog')).toBeInTheDocument();

    // Step 0 -> click "Nah" to go to roast screen (step 2)
    fireEvent.click(getByText(/Nah/i));

    // In step 2, clicking the only action closes dialog
    fireEvent.click(getByText(/Skibidi Out/i));
    expect(handleClose).toHaveBeenCalled();
  });

  it('accepts admin path and validates password', () => {
    const handleClose = vi.fn();
    const onApproved = vi.fn();
    // Mock env var for test
    vi.stubEnv('VITE_ADMIN_PASSWORD', 'pass');
    const { getByText, getByLabelText } = render(
      <AdminDialog open={true} onClose={handleClose} onApproved={onApproved} />
    );
    // Step 0 -> click Bet to go to password
    fireEvent.click(getByText(/Bet/i));
    const input = getByLabelText(/Password/i);
    fireEvent.change(input, { target: { value: 'pass' } });
    fireEvent.click(getByText(/Flex/i));
    expect(handleClose).toHaveBeenCalled();
    expect(onApproved).toHaveBeenCalled();
  });
});
