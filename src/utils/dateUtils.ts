const getISODate = ({
  addSeconds,
  removeSeconds
}: {
  addSeconds?: number;
  removeSeconds?: number;
}) => {
  let dateNow = Date.now();
  if (addSeconds) {
    dateNow += 1000 * addSeconds;
  }
  if (removeSeconds) {
    dateNow -= 1000 * removeSeconds;
  }
  return new Date(new Date(dateNow).toISOString());
};

export default { getISODate };
