export const getToday = () => {
  const today = new Date(Date.now() + (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000);
  const year = today.getFullYear();
  const month = `0${today.getMonth() + 1}`.slice(-2);
  const day = `0${today.getDate()}`.slice(-2);

  return {
    year,
    month,
    day,
  };
};

export const convertText = (text: string) => text.trim().replace(/\n|\s+/g, '');
