import dayjs from 'dayjs';

export const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

export const minutesToTime = (minutes) => {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const isTimeOverlap = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  if (s1 === null || s2 === null) return false;
  const e1Safe = e1 === null ? s1 + 1 : e1;
  const e2Safe = e2 === null ? s2 + 1 : e2;
  return s1 < e2Safe && s2 < e1Safe;
};

export const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss');

export const today = () => dayjs().format('YYYY-MM-DD');

export const getMonthRange = (year, month) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : parseInt(month, 10) + 1;
  const nextYear = month === 12 ? parseInt(year, 10) + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  return { startDate, endDate };
};

export const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  return dayjs(dateStr).isValid();
};

export const isValidTimeRange = (start, end) => {
  if (!start) return true;
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (s === null) return true;
  if (e !== null && e <= s) return false;
  return true;
};

export default {
  timeToMinutes,
  minutesToTime,
  isTimeOverlap,
  now,
  today,
  getMonthRange,
  isValidDate,
  isValidTimeRange
};
