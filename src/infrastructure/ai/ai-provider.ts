export type ClassifyInput = {
  text: string;
  categories: string[];
  instructions?: string;
};

export type ClassificationResult = {
  category: string;
  confidence: number;
};

export interface AIProvider {
  classify(input: ClassifyInput): Promise<ClassificationResult>;
  generate(prompt: string): Promise<string>;
  summarize(text: string): Promise<string>;
}

export class MockAIProvider implements AIProvider {
  public async classify(input: ClassifyInput): Promise<ClassificationResult> {
    const normalizedText = input.text.toLowerCase();
    const category =
      input.categories.find((candidate) => normalizedText.includes(candidate.toLowerCase())) ??
      input.categories[0];

    if (!category) {
      throw new Error('AI classification requires at least one category');
    }

    return {
      category,
      confidence: 0.82,
    };
  }

  public async generate(prompt: string): Promise<string> {
    return `Mock response for: ${prompt}`;
  }

  public async summarize(text: string): Promise<string> {
    return text.length > 160 ? `${text.slice(0, 157)}...` : text;
  }
}

export function createAIProvider(): AIProvider {
  return new MockAIProvider();
}
