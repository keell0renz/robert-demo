import { defineTool } from "eve/tools";
import { z } from "zod";

// Placeholder smoke-test tool so the agent loop has something to call.
// Replace with the real page-building tools (e.g. save_page) as the demo grows.
// The model sees this as `get_weather`, derived from the filename.
export default defineTool({
  description: "Get the current weather for a city.",
  inputSchema: z.object({ city: z.string().min(1) }),
  async execute({ city }) {
    return { city, condition: "Sunny", temperatureF: 72 };
  },
});
