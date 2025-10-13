
import React, { useState } from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// dailyGoals and weeklyGoals should be objects: { [user_id]: [goals] }
export default function AddStrike({ users, onEdit, dailyGoals = {}, weeklyGoals = {}, weeks = [] }) {
  const [selectedUser, setSelectedUser] = useState('');
  const [goalType, setGoalType] = useState('daily');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [comments, setComments] = useState('');

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
    <div style={{padding:'2em', textAlign:'center', color:'#444', maxWidth:400, margin:'0 auto'}}>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="user-select-label">User</InputLabel>
        <Select
          labelId="user-select-label"
          value={selectedUser}
          onChange={e => {
            setSelectedUser(e.target.value);
            setSelectedGoal('');
          }}
        >
          {users && users.length > 0 ? users.map(u => (
            <MenuItem key={u.user_id} value={u.user_id}>{u.user_name || u.user_id}</MenuItem>
          )) : <MenuItem disabled>No users</MenuItem>}
        </Select>
      </FormControl>

      {/* Goal Type label and radios in a single line */}
      <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <FormLabel component="legend" sx={{ mb: 0, mr: 2, whiteSpace: 'nowrap' }}>Goal Type</FormLabel>
          <RadioGroup
            row
            value={goalType}
            onChange={e => { setGoalType(e.target.value); setSelectedGoal(''); }}
            sx={{ flexDirection: 'row' }}
          >
            <FormControlLabel value="daily" control={<Radio />} label="Daily" />
            <FormControlLabel value="weekly" control={<Radio />} label="Weekly" />
          </RadioGroup>
        </div>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="goal-select-label">Goal</InputLabel>
        <Select
          labelId="goal-select-label"
          value={selectedGoal}
          label="Goal"
          onChange={e => setSelectedGoal(e.target.value)}
          disabled={!selectedUser}
        >
          {selectedUser && goalList.length > 0 ? Array.from(new Set(goalList)).map(goal => (
            <MenuItem key={goal} value={goal}>{goal}</MenuItem>
          )) : <MenuItem disabled>No goals</MenuItem>}
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
              textField: { fullWidth: true, sx: { mb: 3 }, disabled: !selectedGoal }
            }}
          />
        </LocalizationProvider>
      )}

      {goalType === 'weekly' && (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="week-select-label">Week</InputLabel>
          <Select
            labelId="week-select-label"
            value={selectedWeek}
            label="Week"
            onChange={e => setSelectedWeek(e.target.value)}
            disabled={!selectedUser}
          >
            {weeks.length > 0 ? weeks.map(week => (
              <MenuItem key={week} value={week}>{week}</MenuItem>
            )) : <MenuItem disabled>No weeks</MenuItem>}
          </Select>
        </FormControl>
      )}

      <TextField
        label="Comments"
        value={comments}
        onChange={e => {
          const val = e.target.value;
          // Allow only alphanumerics, comma, hyphen, and single quote
          if (/^[a-zA-Z0-9,'\- ]*$/.test(val) || val === '') {
            setComments(val);
          }
        }}
        fullWidth
        sx={{ mb: 3 }}
        inputProps={{ maxLength: 200 }}
        placeholder="Optional comments"
      />

      <Button
        variant="contained"
        color="primary"
        disabled={!selectedUser || !selectedGoal || (goalType === 'daily' ? !selectedDate : !selectedWeek)}
        onClick={() => onEdit && onEdit({
          user_id: selectedUser,
          goalType,
          goal: selectedGoal,
          date: goalType === 'daily' ? selectedDate : undefined,
          week: goalType === 'weekly' ? selectedWeek : undefined,
          comments: comments.trim()
        })}
      >
        Add Strike <span role="img" aria-label="knife">🔪</span>
      </Button>
    </div>
  );
}
