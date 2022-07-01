const getValueFromObject = (obj: { [key: string]: any }, key: string) =>
  obj[key as keyof typeof obj];

export default {
  getValueFromObject
};
