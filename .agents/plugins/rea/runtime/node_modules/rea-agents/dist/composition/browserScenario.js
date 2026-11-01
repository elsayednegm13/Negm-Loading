import { PlaywrightBrowserScenarioProvider } from "../browser/PlaywrightBrowserScenarioProvider.js";
import { PlaywrightScenarioSession } from "../browser/PlaywrightScenarioSession.js";
/** Construct a fresh provider without opening a target or acquiring an engine. */
export const createBrowserScenarioProvider = (environment) => new PlaywrightBrowserScenarioProvider((scenario, options) => PlaywrightScenarioSession.open(scenario, environment, options));
