export default (req, res) => {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const baseUrl = req ? `${protocol}://${req.headers.host}` : "";
  // invoke parallel API steps with fetch without waiting for result
  const from = 0;
  const to = 10;
  for (let i = from; i < to; i++) {
    fetch(`${baseUrl}/api/step/${i}?end=${i + 5}`);
  }
  res.statusCode = 200;
  res.json({ message: `invoked ${to - from} parallel requests` });
};
