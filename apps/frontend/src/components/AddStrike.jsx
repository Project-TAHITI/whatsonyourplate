import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getWeekRange } from '../utils/dateUtils';
import { useTheme } from '@mui/material/styles';

export default function AddStrike({
  users,
  onEdit,
  dailyGoals = {},
  weeklyGoals = {},
  weeks = [],
}) {
  const [selectedUser, setSelectedUser] = useState('');
  const [goalType, setGoalType] = useState('daily');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [comments, setComments] = useState('');
  const theme = useTheme();

  // Get unique goals for the selected user and type
  let goalList = [];
  if (selectedUser) {
    if (goalType === 'daily' && dailyGoals[selectedUser]) {
      goalList = Array.from(new Set(dailyGoals[selectedUser]));
    } else if (goalType === 'weekly' && weeklyGoals[selectedUser]) {
      goalList = Array.from(new Set(weeklyGoals[selectedUser]));
    }
  }

  return (
    <Box
      sx={{
        padding: '2.2em 2em 2.5em 2em',
        textAlign: 'center',
        color: theme.palette.text.primary,
        maxWidth: 440,
        margin: '0 auto',
        bgcolor: 'background.paper',
        borderRadius: 4, // further reduced
        border: '3px dashed #a855f7',
        boxShadow: '0 6px 32px 0 rgba(124,58,237,0.13)',
        fontSize: '1.13rem',
        letterSpacing: '0.02em',
        transition: 'all 0.2s cubic-bezier(.4,2,.6,1)',
      }}
      className="comic-font"
    >
      <div>
        <FormControl fullWidth sx={{ mb: 3 }} className="comic-font">
          <InputLabel id="user-select-label">User</InputLabel>
          <Select
            labelId="user-select-label"
            id="user-select"
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setSelectedGoal('');
            }}
            inputProps={{ 'aria-label': 'Select user' }}
          >
            {users && users.length > 0 ? (
              users.map((u) => (
                <MenuItem key={u.user_id} value={u.user_id}>
                  {u.user_name || u.user_id}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No users</MenuItem>
            )}
          </Select>
        </FormControl>

        {/* Goal Type label and radios in a single line */}
        <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }} className="comic-font">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <FormLabel
              component="legend"
              id="goal-type-label"
              sx={{ mb: 0, mr: 2, whiteSpace: 'nowrap' }}
              className="comic-font"
            >
              Goal Type
            </FormLabel>
            <RadioGroup
              row
              aria-labelledby="goal-type-label"
              value={goalType}
              onChange={(e) => {
                setGoalType(e.target.value);
                setSelectedGoal('');
              }}
              sx={{ flexDirection: 'row' }}
            >
              <FormControlLabel value="daily" control={<Radio />} label="Daily" />
              <FormControlLabel value="weekly" control={<Radio />} label="Weekly" />
            </RadioGroup>
          </div>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 3 }} className="comic-font">
          <InputLabel id="goal-select-label">Goal</InputLabel>
          <Select
            labelId="goal-select-label"
            id="goal-select"
            value={selectedGoal}
            label="Goal"
            onChange={(e) => setSelectedGoal(e.target.value)}
            disabled={!selectedUser}
            inputProps={{ 'aria-label': 'Select goal' }}
          >
            {selectedUser && goalList.length > 0 ? (
              Array.from(new Set(goalList)).map((goal) => (
                <MenuItem key={goal} value={goal}>
                  {goal}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No goals</MenuItem>
            )}
          </Select>
        </FormControl>

        {goalType === 'daily' && (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DesktopDatePicker
              label="Date"
              format="yyyy-MM-dd"
              value={selectedDate}
              onChange={setSelectedDate}
              minDate={new Date('2025-10-02')}
              maxDate={new Date('2025-12-21')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { mb: 3 },
                  inputProps: { 'aria-label': 'Select date' },
                },
              }}
            />
          </LocalizationProvider>
        )}

        {goalType === 'weekly' && (
          <FormControl fullWidth sx={{ mb: 3 }} className="comic-font">
            <InputLabel id="week-select-label">Week</InputLabel>
            <Select
              labelId="week-select-label"
              id="week-select"
              value={selectedWeek}
              label="Week"
              onChange={(e) => setSelectedWeek(e.target.value)}
              inputProps={{ 'aria-label': 'Select week' }}
            >
              {weeks.length > 0 ? (
                weeks.map((week) => (
                  <MenuItem key={week} value={week}>
                    {week} ({getWeekRange(week)})
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No weeks</MenuItem>
              )}
            </Select>
          </FormControl>
        )}

        <TextField
          label="Comments"
          value={comments}
          onChange={(e) => {
            const val = e.target.value;
            // Allow only alphanumerics, comma, hyphen, and single quote
            if (/^[a-zA-Z0-9,'\- ]*$/.test(val) || val === '') {
              setComments(val);
            }
          }}
          fullWidth
          sx={{ mb: 3 }}
          className="comic-font"
          inputProps={{ maxLength: 200, 'aria-label': 'Comments' }}
          placeholder="Optional comments"
        />

        <Button
          variant="contained"
          color="primary"
          aria-label="Add Strike"
          disabled={
            !selectedUser || !selectedGoal || (goalType === 'daily' ? !selectedDate : !selectedWeek)
          }
          onClick={() => {
            onEdit &&
              onEdit({
                user_id: selectedUser,
                goalType,
                goal: selectedGoal,
                date: goalType === 'daily' ? selectedDate : undefined,
                week: goalType === 'weekly' ? selectedWeek : undefined,
                comments: comments.trim(),
              });
          }}
          className="comic-font-bold"
        >
          Add Strike{' '}
          <span role="img" aria-label="knife">
            🔪
          </span>
        </Button>
      </div>
    </Box>
  );
}
