import React, { useState, useEffect, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { EMOJI } from '../constants/emojis.js';

export default function AdminDialog({ open, onClose, onApproved }) {
  const [step, setStep] = useState(0); // 0: ask, 1: password, 2: not admin
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Only reset state when dialog transitions from closed to open
  const prevOpen = useRef(open);
  useEffect(() => {
    if (!prevOpen.current && open) {
      queueMicrotask(() => {
        setStep(0);
        setPassword('');
        setError('');
      });
    }
    prevOpen.current = open;
  }, [open]);

  const handleAdminYes = () => setStep(1);
  const handleAdminNo = () => setStep(2);
  const handleRoastClose = onClose;
  const handleAdminPassword = () => {
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      onClose();
      if (onApproved) onApproved();
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} aria-modal="true" aria-labelledby="admin-dialog-title">
      {step === 0 && (
        <>
          <DialogTitle id="admin-dialog-title">
            Do you think you have enough <span style={{ color: '#a855f7' }}>Aura</span> to add a
            Strike?
          </DialogTitle>
          <DialogActions>
            <Button onClick={handleAdminYes} color="primary">
              Bet {EMOJI.DIZZY}
            </Button>
            <Button onClick={handleAdminNo} color="secondary">
              Nah {EMOJI.SWEAT_SMILE}
            </Button>
          </DialogActions>
        </>
      )}
      {step === 1 && (
        <>
          <DialogTitle id="admin-dialog-title">
            Drop your secret sauce to prove your vibe
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdminPassword();
                }
              }}
              error={!!error}
              helperText={error}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleAdminPassword} color="primary">
              Flex {EMOJI.FLEX}
            </Button>
            <Button onClick={onClose} color="secondary">
              Back Out {EMOJI.DOOR}
            </Button>
          </DialogActions>
        </>
      )}
      {step === 2 && (
        <>
          <DialogTitle id="admin-dialog-title">
            Touch grass, come back with some real main character energy.{' '}
            <span role="img" aria-label="skull">
              {EMOJI.SKULL}
            </span>
          </DialogTitle>
          <DialogActions>
            <Button onClick={handleRoastClose} color="primary">
              Skibidi Out!! {EMOJI.SOB}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
