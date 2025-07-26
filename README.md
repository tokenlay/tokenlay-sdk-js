# @tokenlay/sdk – JavaScript Client

A lightweight OpenAI-compatible SDK for routing your LLM calls through the Tokenlay proxy — enabling real-time usage tracking, spend control, and per-user limits.

Tokenlay helps developers stay profitable by enforcing usage policies and providing billing visibility — without needing to rebuild infrastructure.

---

## Installation

```bash
npm install @tokenlay/sdk openai
```

> `openai` is a peer dependency.

---

## Quickstart

```ts
import { TokenlayOpenAI } from "@tokenlay/sdk";
import OpenAI from "openai";

const openai = new TokenlayOpenAI({
  providerApiKey: process.env.PROVIDER_API_KEY,
  providerApiBase: process.env.PROVIDER_API_BASE,
  tokenlayKey: process.env.TOKENLAY_KEY,
});

const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: "Hello, world!" }],
});

console.log(response.choices[0].message.content);
```

---

## Common Providers & Example Models

Tokenlay supports most major LLM providers out of the box, powered by [LiteLLM](https://github.com/BerriAI/litellm).  
Here are some common providers and example model names:

| Provider    | `providerApiBase`              | Example Models                                                                                                    |
| ----------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| OpenAI      | `https://api.openai.com/v1`    | `gpt-4o`, `o4-mini`, `o3`                               |
| Anthropic   | `https://api.anthropic.com/v1` | `claude-opus-4`, `claude-sonnet-4`                 |
| Mistral     | `https://api.mistral.ai/v1`    | `mistral-large-24.11`, `codestral-25.01` |
| OpenRouter  | `https://openrouter.ai/v1`     | `mistralai/mistral-7b-instruct`                            |
| Together AI | `https://api.together.xyz/v1`  | `togethercomputer/llama-2-13b-chat`                      |

> For a comprehensive list of models and providers, see: [→ List](https://docs.tokenlay.com/does-not-exist)

---

## Per-User Tracking & Custom Metadata

To enable per-user usage tracking, Tokenlay supports passing a `user` identifier — or **any custom fields** — via the `extraHeaders` option.

This is entirely optional, but highly recommended for applying user-level enforcement and attribution.

### How to Pass a User UUID

```ts
const openai = new TokenlayOpenAI({
  providerApiKey: process.env.PROVIDER_API_KEY,
  providerApiBase: process.env.PROVIDER_API_BASE,
  tokenlayKey: process.env.TOKENLAY_KEY,
  extraHeaders: {
    user: "user_abc123" // Your internal user ID
  }
});
```

> You can also set `extraHeaders` dynamically per request for variable context. [→ Docs](https://docs.tokenlay.com/does-not-exist)

### Example: Custom Metadata

You can add any fields relevant to your system:

```ts
extraHeaders: {
  user: "user_abc123",
  org: "org_456xyz",
  plan: "pro",
  project: "chatbot_xyz",
  feature: "autocomplete"
}
```

These headers are forwarded to Tokenlay and become visible in logs, dashboards, and usage enforcement.

---

## Getting Your Tokenlay Key

Use of this SDK requires a **Tokenlay API key**, which links requests to your account and enables tracking, enforcement, and billing visibility.

You can generate a key from the [Tokenlay Dashboard](https://tokenlay.com/signup) — **absolutely free**.

Once configured, your key powers:

- **Live dashboards** to monitor real-time token usage and spending  
- **Flexible policies** including per-user limits, monthly caps, and org-wide rules  
- **Granular enforcement** with attribution by user, org, project, or pricing tier  
- **Smart fallbacks** like model shifting or throttling — keeping users happy without compromising margins

> Tokenlay helps developers stay profitable by stopping overuse and runaway spend — no need to rebuild metering, limits, or dashboards yourself.

## Documentation

- Overview: [tokenlay.com](https://tokenlay.com)  
- Full docs: [docs.tokenlay.com](https://docs.tokenlay.com)  
- Python SDK: [`tokenlay`](https://pypi.org/project/tokenlay/)

> Want to go deeper? [→ Explore the full docs for advanced usage and best practices](https://docs.tokenlay.com)


---

## License

MIT
