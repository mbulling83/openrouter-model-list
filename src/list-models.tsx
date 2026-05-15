import { Action, ActionPanel, Color, List, showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";

interface ModelPricing {
  prompt: string;
  completion: string;
  image?: string;
  request?: string;
}

interface ModelArchitecture {
  modality: string;
  tokenizer: string;
  instruct_type: string | null;
}

interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: ModelPricing;
  context_length: number;
  architecture: ModelArchitecture;
  top_provider?: {
    max_completion_tokens?: number;
  };
}

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

function formatPrice(price: string): string {
  const num = parseFloat(price);
  if (isNaN(num) || num === 0) return "Free";
  const perMillion = num * 1_000_000;
  if (perMillion < 0.01) return `$${perMillion.toFixed(4)}/M`;
  if (perMillion % 1 === 0) return `$${perMillion.toFixed(0)}/M`;
  return `$${perMillion.toFixed(2)}/M`;
}

function priceColor(price: string): Color {
  const num = parseFloat(price);
  if (isNaN(num) || num === 0) return Color.Green;
  const perMillion = num * 1_000_000;
  if (perMillion <= 1) return Color.Green;
  if (perMillion <= 10) return Color.Yellow;
  return Color.Red;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${n}`;
}

function getProvider(modelId: string): string {
  return (modelId.split("/")[0] ?? modelId).replace(/^~/, "");
}

function getDisplayName(name: string, modelId: string): string {
  // Strip "Provider: Model" format
  const colonIndex = name.indexOf(": ");
  if (colonIndex !== -1) return name.slice(colonIndex + 2);

  // Strip leading provider word (e.g. "Anthropic Claude..." → "Claude...")
  const provider = getProvider(modelId);
  if (provider && name.toLowerCase().startsWith(provider.toLowerCase() + " ")) {
    return name.slice(provider.length + 1);
  }

  return name;
}

export default function ListModels() {
  const { data, isLoading, error } = useFetch<OpenRouterResponse>("https://openrouter.ai/api/v1/models", {
    keepPreviousData: true,
  });

  if (error) {
    showToast({ style: Toast.Style.Failure, title: "Failed to load models", message: error.message });
  }

  const models = data?.data ?? [];

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search models...">
      {models.map((model) => {
        const provider = getProvider(model.id);
        const promptFormatted = formatPrice(model.pricing.prompt);
        const completionFormatted = formatPrice(model.pricing.completion);
        const contextText = model.context_length ? formatNumber(model.context_length) : undefined;

        const accessories: List.Item.Accessory[] = [];
        if (contextText) {
          accessories.push({ tag: { value: contextText, color: Color.SecondaryText }, tooltip: "Context window" });
        }
        accessories.push({
          tag: { value: `in ${promptFormatted}`, color: priceColor(model.pricing.prompt) },
          tooltip: "Prompt cost per million tokens",
        });
        accessories.push({
          tag: { value: `out ${completionFormatted}`, color: priceColor(model.pricing.completion) },
          tooltip: "Completion cost per million tokens",
        });

        return (
          <List.Item
            key={model.id}
            title={getDisplayName(model.name, model.id)}
            subtitle={provider}
            accessories={accessories}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title="Copy Model ID" content={model.id} />
                <Action.OpenInBrowser
                  title="Open on OpenRouter"
                  url={`https://openrouter.ai/models/${model.id}`}
                  shortcut={{ modifiers: ["cmd"], key: "o" }}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
