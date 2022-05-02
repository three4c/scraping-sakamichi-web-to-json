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

export const convertTime = (time: string) => {
  const matchText = time.match(/([0-9]|1[0-9]|2[0-9]):[0-5][0-9]/g);
  return matchText ? matchText.map((item) => `0${item}`.slice(-5)) : undefined;
};
