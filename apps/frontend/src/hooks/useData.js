import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@libs/supabaseClient.js';

// Contract:
// returns { data, usersMap, error, loading, loadingTimeout, refresh }
// - data: [{ user_id, daily_goals: { [date]: {goal,completed,comments}[] }, weekly_goals: { [week]: {...}[] } }]
// - usersMap: { [user_id]: user_name }
// - loading: boolean for initial fetch
// - loadingTimeout: true if initial fetch exceeded threshold (10s)
// - refresh: function to re-fetch
export function useData() {
  const [data, setData] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  const fetchData = async () => {
    setError('');
    setLoading(true);
    try {
      const { data: users, error: userErr } = await supabase.from('users').select('*');
      if (userErr) throw userErr;

      const map = {};
      users.forEach((u) => {
        map[u.user_id] = u.user_name || u.user_id;
      });

      // Fetch all daily tracker rows in batches if needed
      let daily = [];
      let from = 0,
        to = 999;
      let totalDaily = 0;
      do {
        const {
          data: batch,
          error: dailyErr,
          count,
        } = await supabase
          .from('daily_goal_tracker')
          .select('*', { count: 'exact' })
          .range(from, to);
        if (dailyErr) throw dailyErr;
        if (batch) daily = daily.concat(batch);
        if (count !== null) totalDaily = count;
        from += 1000;
        to += 1000;
      } while (from < totalDaily);

      // Fetch all weekly tracker rows in batches if needed
      let weekly = [];
      from = 0;
      to = 999;
      let totalWeekly = 0;
      do {
        const {
          data: batch,
          error: weeklyErr,
          count,
        } = await supabase
          .from('weekly_goal_tracker')
          .select('*', { count: 'exact' })
          .range(from, to);
        if (weeklyErr) throw weeklyErr;
        if (batch) weekly = weekly.concat(batch);
        if (count !== null) totalWeekly = count;
        from += 1000;
        to += 1000;
      } while (from < totalWeekly);

      // Group daily/weekly by user
      const trackerData = users.map((u) => {
        const user_id = u.user_id;
        const dailyGoals = {};
        daily
          .filter((d) => d.user_id === user_id)
          .forEach((row) => {
            if (!dailyGoals[row.date]) dailyGoals[row.date] = [];
            dailyGoals[row.date].push({
              goal: row.goal,
              completed: row.completed,
              comments: row.comments,
            });
          });
        const weeklyGoals = {};
        weekly
          .filter((w) => w.user_id === user_id)
          .forEach((row) => {
            if (!weeklyGoals[row.week]) weeklyGoals[row.week] = [];
            weeklyGoals[row.week].push({
              goal: row.goal,
              completed: row.completed,
              comments: row.comments,
            });
          });
        return { user_id, daily_goals: dailyGoals, weekly_goals: weeklyGoals };
      });

      setData(trackerData);
      setUsersMap(map);
      // Return the fetched data so callers can await and use it if needed
      return { data: trackerData, usersMap: map };
    } catch (err) {
      setError('Could not load tracker or user data');
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchData();
  }, []);

  // loading timeout behavior mirrors previous implementation
  const timeoutRef = useRef(null);
  useEffect(() => {
    if (loading) {
      // reset and start timer
      setLoadingTimeout(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setLoadingTimeout(true), 10000);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setLoadingTimeout(false);
    }
  }, [loading]);

  const refresh = useMemo(() => ({ run: fetchData }), []);

  return { data, usersMap, error, loading, loadingTimeout, refresh };
}
