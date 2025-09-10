const API_KEY = process.env.SEARCH_API_KEY;

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export async function searchSearch(query: string): Promise<SearchResult[]> {
  const url = `https://www.searchapi.io/api/v1/search?engine=google&q=${encodeURIComponent(query)}&api_key=${API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  return data.organic_results.map((r: any) => ({
    title: r.title,
    link: r.link,
    snippet: r.snippet,
  }));
}
