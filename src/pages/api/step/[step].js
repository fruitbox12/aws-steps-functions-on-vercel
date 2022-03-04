import delay from "../../../delay";

export default async (req, res) => {
  const { step: stepString, end: endString } = req.query;
  const step = parseInt(stepString, 10);
  const end = parseInt(endString, 10);

  await delay(4000);
  // redirect 307 to next API step if not to end
  if (step < end) {
    console.log(`Redirecting to step ${step + 1}`);
    res.writeHead(307, {
      Location: `/api/step/${step + 1}?end=${end}`,
    });
    res.end();
  } else {
    // result arrived to step number
    console.log(`Result arrived to step ${step}`);
    res.statusCode = 200;
    res.json({ result: step });
  }
};
